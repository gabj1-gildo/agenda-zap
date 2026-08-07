import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clientSubscriptions, tenantPlans, paymentKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { addDays } from 'date-fns';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');
    const body = await req.json();
    
    console.log('[Mercado Pago Webhook] Recebido:', body);

    if (!tenantId) {
      console.error('[Mercado Pago Webhook] Missing tenantId in query params');
      return NextResponse.json({ success: false, error: 'Missing tenantId' }, { status: 400 });
    }

    if (body.action === 'payment.created' || body.type === 'payment') {
      const paymentId = body.data?.id;
      if (!paymentId) return NextResponse.json({ success: true });

      const activeKey = await db.query.paymentKeys.findFirst({
        where: and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.isActive, true), eq(paymentKeys.gateway, 'MERCADOPAGO'))
      });

      if (!activeKey) {
        console.error(`[Mercado Pago Webhook] No active key found for tenant ${tenantId}`);
        return NextResponse.json({ success: false, error: 'No active key' }, { status: 400 });
      }

      // Fetch payment details from MP
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${activeKey.token}`
        }
      });
      const paymentData = await mpRes.json();

      if (paymentData.status === 'approved') {
        const metadata = paymentData.metadata;
        if (metadata && metadata.type === 'plan_subscription') {
          const { client_id, plan_id } = metadata;
          
          const plan = await db.query.tenantPlans.findFirst({
            where: eq(tenantPlans.id, plan_id)
          });

          if (plan) {
            const endDate = plan.durationDays ? addDays(new Date(), plan.durationDays) : null;
            
            await db.insert(clientSubscriptions).values({
              clientId: client_id,
              tenantPlanId: plan.id,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: endDate,
            });
            console.log(`[Mercado Pago Webhook] Assinatura/Compra ativada para o plano ${plan.id}, cliente ${client_id}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Mercado Pago Webhook] Erro:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
