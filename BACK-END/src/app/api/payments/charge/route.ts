import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, paymentKeys, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendWhatsAppMessage, sendWhatsAppImage } from '@/services/whatsappService';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { appointmentId, paymentMethod } = await req.json();

    if (!appointmentId || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'appointmentId and paymentMethod are required' }, { status: 400 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch appointment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: { client: true }
    });

    if (!appointment) return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    if (!canAccessTenant(user, appointment.tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const tenantList = await db.select().from(tenants).where(eq(tenants.id, appointment.tenantId));
    const tenant = tenantList[0];

    // 2. Fetch active payment key
    const activeKey = await db.query.paymentKeys.findFirst({
      where: and(
        eq(paymentKeys.tenantId, appointment.tenantId),
        eq(paymentKeys.isActive, true)
      )
    });

    if (!activeKey || !activeKey.token) {
      return NextResponse.json({ success: false, error: 'No active payment gateway configured' }, { status: 400 });
    }

    const clientPhone = appointment.client?.phone;
    const clientName = appointment.client?.name || 'Cliente';
    const serviceName = appointment.serviceName || 'Agendamento';
    const priceFormatted = parseFloat(appointment.price).toFixed(2).replace('.', ',');
    let responseData: any = {};

    let pixCode = "";
    let paymentLink = "";
    let paymentId = "";

    // 3A. Mercado Pago Logic
    if (activeKey.gateway === 'MERCADOPAGO') {
      if (paymentMethod === 'pix') {
        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeKey.token}`,
            'X-Idempotency-Key': `pix_${appointment.id}_${Date.now()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transaction_amount: parseFloat(appointment.price),
            description: serviceName,
            payment_method_id: 'pix',
            payer: {
              email: `cliente_${appointment.client?.id || Date.now()}@AgendaZap.com`,
              first_name: clientName,
            },
            external_reference: appointment.id
          })
        });

        const mpData = await mpRes.json();
        if (!mpRes.ok) {
          console.error('MP Pix Error:', mpData);
          return NextResponse.json({ success: false, error: 'Failed to generate MP Pix code' }, { status: 500 });
        }
        pixCode = mpData.point_of_interaction?.transaction_data?.qr_code;
        paymentId = mpData.id?.toString();
      } else {
        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${activeKey.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ title: serviceName, quantity: 1, currency_id: 'BRL', unit_price: parseFloat(appointment.price) }],
            payer: { name: clientName },
            external_reference: appointment.id
          })
        });
        const mpData = await mpRes.json();
        if (!mpRes.ok) {
          console.error('MP Link Error:', mpData);
          return NextResponse.json({ success: false, error: 'Failed to generate MP Link' }, { status: 500 });
        }
        paymentLink = mpData.init_point;
        paymentId = mpData.id?.toString();
      }
    } 
    // 3B. AbacatePay Logic
    else if (activeKey.gateway === 'ABACATEPAY') {
      const priceInCents = Math.round(parseFloat(appointment.price) * 100);

      if (paymentMethod === 'pix') {
        const apRes = await fetch('https://api.abacatepay.com/v2/transparents/create', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${activeKey.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'PIX', data: { amount: priceInCents, description: serviceName, expiresIn: 86400 } })
        });
        const apData = await apRes.json();
        if (!apRes.ok) {
          console.error('AbacatePay Pix Error:', apData);
          return NextResponse.json({ success: false, error: 'Failed to generate AbacatePay Pix' }, { status: 500 });
        }
        pixCode = apData.data?.brCode || apData.brCode; 
        paymentId = apData.data?.id || apData.id || `ap_pix_${Date.now()}`;
      } else {
        const apRes = await fetch('https://api.abacatepay.com/v1/billing/create', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${activeKey.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frequency: "ONE_TIME",
            products: [{ externalId: appointment.id, name: serviceName, quantity: 1, price: priceInCents }],
            customer: { name: clientName, cellphone: clientPhone || '11999999999' }
          })
        });
        const apData = await apRes.json();
        if (!apRes.ok) {
          console.error('AbacatePay Link Error:', apData);
          return NextResponse.json({ success: false, error: 'Failed to generate AbacatePay Link' }, { status: 500 });
        }
        paymentLink = apData.data?.url || apData.url || apData.data?.billingUrl;
        paymentId = apData.data?.id || apData.id || `ap_link_${Date.now()}`;
      }
    } else {
      return NextResponse.json({ success: false, error: 'Gateway not supported' }, { status: 400 });
    }

    // 4. Update Database
    await db.update(appointments)
      .set({ paymentId, pixCode: pixCode || null })
      .where(eq(appointments.id, appointment.id));

    // 5. Send WhatsApp message
    if (paymentMethod === 'pix' && pixCode) {
      responseData = { success: true, pixCode, paymentId };
      if (clientPhone) {
        const introMsg = `OlÃ¡ ${clientName}! Segue o cÃ³digo Pix Copia e Cola para o pagamento do seu agendamento de *${serviceName}* no valor de R$ *${priceFormatted}*:`;
        await sendWhatsAppMessage(clientPhone, introMsg, tenant?.id || undefined);
        await new Promise(r => setTimeout(r, 1000));
        await sendWhatsAppMessage(clientPhone, pixCode, tenant?.id || undefined);
      }
    } else if (paymentLink) {
      responseData = { success: true, paymentLink, paymentId };
      if (clientPhone) {
        const msg = `OlÃ¡ ${clientName}! Segue o link para o pagamento do seu agendamento de *${serviceName}* no valor de R$ *${priceFormatted}*:\n\n${paymentLink}`;
        await sendWhatsAppMessage(clientPhone, msg, tenant?.id || undefined);
      }
    } else {
      return NextResponse.json({ success: false, error: 'Could not generate payment' }, { status: 500 });
    }
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error generating charge:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
