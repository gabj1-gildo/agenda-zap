import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clientSubscriptions } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Asaas Webhook] Recebido:', body);

    // Asaas envia webhook de PAYMENT_RECEIVED ou PAYMENT_CONFIRMED
    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
      const paymentId = body.payment?.id;
      
      // Aqui faríamos: const payment = await asaas.payments.get(paymentId)
      const mockMetadata = {
        tenantId: 'b8bbbe2a-5793-4a17-b6f7-111122223333', // Fake
        clientId: 'c9ccce3b-6894-4b28-c7e8-444455556666',
        planId: 'a7aaae19-4682-4c06-a5e6-777788889999'
      };

      console.log(`[Asaas Webhook] Assinatura/Compra ativada para o plano ${mockMetadata.planId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Asaas Webhook] Erro:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
