import { NextResponse } from 'next/server';
import { processSaasPayment } from '@/services/saasWebhookProcessor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK ASAAS SAAS] Evento recebido:', body.event);

    // O Asaas envia os eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED (no caso de cartão)
    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
      const payment = body.payment;
      if (!payment) return NextResponse.json({ success: true });

      const externalReference = payment.externalReference;
      const paymentId = payment.id;
      const customerId = payment.customer;
      const subscriptionId = payment.subscription; // Pode ser null se for cobrança avulsa (anual)

      if (externalReference) {
        await processSaasPayment(externalReference, 'ASAAS', paymentId, customerId, subscriptionId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[WEBHOOK ASAAS SAAS ERROR]', error);
    return NextResponse.json({ success: false, error: 'Erro no webhook Asaas' }, { status: 500 });
  }
}
