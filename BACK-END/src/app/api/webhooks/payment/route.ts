import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, clients, paymentKeys, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import { syncAppointmentToCalendar } from '@/services/googleCalendar';
import { dispatchWebhook } from '@/services/webhookDispatcher';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const source = url.searchParams.get('source'); // ?source=mercadopago ou abacatepay
    const body = await req.json();

    console.log(`[WEBHOOK PAGAMENTO] Fonte: ${source || 'Desconhecido'}`, body);

    let paymentId: string | null = null;
    let isApproved = false;
    let isCancelled = false;

    // Detectar Mercado Pago
    if (source === 'mercadopago' || (body.action && body.data && body.data.id)) {
      if (body.action === 'payment.updated' || body.type === 'payment') {
        paymentId = body.data.id.toString();
        isApproved = true; 
      }
    } 
    // Detectar AbacatePay
    else if (source === 'abacatepay' || body.status === 'PAID' || body.status === 'EXPIRED' || body.status === 'CANCELLED') {
      paymentId = body.paymentId || body.id;
      if (body.status === 'PAID') isApproved = true;
      if (body.status === 'EXPIRED' || body.status === 'CANCELLED') isCancelled = true;
    }
    // Detectar Asaas
    else if (source === 'asaas' || (body.event && body.payment && body.payment.id)) {
      paymentId = body.payment.id;
      if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
        isApproved = true;
      }
      if (body.event === 'PAYMENT_OVERDUE' || body.event === 'PAYMENT_DELETED') {
        isCancelled = true;
      }
    }

    if (paymentId) {
      // Buscar o agendamento no banco
      const appointmentList = await db.select().from(appointments).where(eq(appointments.paymentId, paymentId));
      
      if (appointmentList.length > 0) {
        const appointment = appointmentList[0];

        if (source === 'mercadopago' || (body.action && body.data && body.data.id)) {
            const keysList = await db.select().from(paymentKeys).where(eq(paymentKeys.tenantId, appointment.tenantId));
            const mpKey = keysList.find(k => k.gateway === 'MERCADOPAGO' && k.isActive);
            if (!mpKey) {
                console.error('[WEBHOOK PAGAMENTO] Chave Mercado Pago não encontrada para o tenant');
                return NextResponse.json({ success: false, error: 'Chave Mercado Pago não encontrada' }, { status: 400 });
            }
            
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${mpKey.token}` }
            });
            const mpData = await mpResponse.json();
            isApproved = mpData.status === 'approved';
            isCancelled = mpData.status === 'cancelled' || mpData.status === 'rejected';
        } else if (source === 'asaas' || (body.event && body.payment && body.payment.id)) {
            const keysList = await db.select().from(paymentKeys).where(eq(paymentKeys.tenantId, appointment.tenantId));
            const asaasKey = keysList.find(k => k.gateway === 'ASAAS' && k.isActive);
            if (!asaasKey) {
                console.error('[WEBHOOK PAGAMENTO] Chave Asaas não encontrada para o tenant');
                return NextResponse.json({ success: false, error: 'Chave Asaas não encontrada' }, { status: 400 });
            }
            
            try {
              const asaasResponse = await fetch(`https://api.asaas.com/v3/payments/${paymentId}`, {
                  headers: { access_token: asaasKey.token }
              });
              if (asaasResponse.ok) {
                const asaasData = await asaasResponse.json();
                isApproved = asaasData.status === 'RECEIVED' || asaasData.status === 'CONFIRMED';
                isCancelled = asaasData.status === 'OVERDUE' || asaasData.deleted === true;
              }
            } catch (e) {
              console.error('Erro ao verificar pagamento Asaas:', e);
            }
        }

        if (isApproved) {
            // Atualiza status no banco
            await db.update(appointments).set({ status: 'PAGO' }).where(eq(appointments.id, appointment.id));
            
            // Sincroniza com Google Calendar (apenas após o pagamento como decidido)
            await syncAppointmentToCalendar(appointment.id).catch(e => console.error('Erro ao sincronizar com Calendar', e));


            // Buscar telefone do cliente para enviar notificação
            const clientList = await db.select().from(clients).where(eq(clients.id, appointment.clientId));
            if (clientList.length > 0) {
                const client = clientList[0];
                const phoneJid = `${client.phone}@s.whatsapp.net`;
                const mensagemConfirmacao = `🎉 *Pagamento Confirmado!*\n\nSeu agendamento para o serviço *${appointment.serviceName}* foi garantido com sucesso.\nObrigado pela preferência e até logo!`;
                
                const tenantList = await db.select().from(tenants).where(eq(tenants.id, appointment.tenantId));
                const tenant = tenantList[0];
                
                await sendWhatsAppMessage(phoneJid, mensagemConfirmacao, tenant?.id || undefined);
                console.log(`[PAGAMENTO] Status atualizado e mensagem enviada para ${client.phone}`);
                
                dispatchWebhook(appointment.tenantId, 'PAYMENT_RECEIVED', { appointmentId: appointment.id, paymentId, amount: body?.data?.transaction_amount || body?.payment?.value || null }).catch(console.error);
            }
        } else if (isCancelled) {
            // Atualiza status no banco para CANCELADO
            await db.update(appointments).set({ status: 'CANCELADO' }).where(eq(appointments.id, appointment.id));

            // Enviar notificação de expiração para o cliente
            const clientList = await db.select().from(clients).where(eq(clients.id, appointment.clientId));
            if (clientList.length > 0) {
                const client = clientList[0];
                const phoneJid = `${client.phone}@s.whatsapp.net`;
                const mensagemExpiracao = `⚠️ *Atenção!*\n\nO tempo para pagamento do seu agendamento para o serviço *${appointment.serviceName}* expirou e ele foi cancelado.\nPor favor, faça um novo agendamento se ainda desejar o serviço.`;
                
                const tenantList = await db.select().from(tenants).where(eq(tenants.id, appointment.tenantId));
                const tenant = tenantList[0];
                
                await sendWhatsAppMessage(phoneJid, mensagemExpiracao, tenant?.id || undefined);
                console.log(`[PAGAMENTO] Status cancelado/expirado e mensagem enviada para ${client.phone}`);
                
                dispatchWebhook(appointment.tenantId, 'APPOINTMENT_CANCELED', { appointmentId: appointment.id, reason: 'PAYMENT_EXPIRED' }).catch(console.error);
            }
        } else {
             console.log(`[PAGAMENTO] Pagamento ${paymentId} não está aprovado nem cancelado. Status ignorado.`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no webhook de pagamento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
