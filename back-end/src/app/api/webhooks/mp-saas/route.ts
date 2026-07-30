import { NextResponse } from 'next/server';
import { processSaasPayment } from '@/services/saasWebhookProcessor';
import { env } from '@/config/env';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('type') || url.searchParams.get('topic');
    const id = url.searchParams.get('data.id') || url.searchParams.get('id');
    
    // Suporta body json do MP também
    let body: any = {};
    try { body = await request.json(); } catch(e) {}
    
    const paymentId = body?.data?.id || id;
    const topic = body?.type || action;

    console.log(`[WEBHOOK MP SAAS] Evento recebido: ${topic} | ID: ${paymentId}`);

    if (topic === 'payment' && paymentId) {
      // Busca detalhes do pagamento no MP
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
      });
      
      if (mpResponse.ok) {
        const mpData = await mpResponse.json();
        
        if (mpData.status === 'approved') {
          const externalReference = mpData.external_reference;
          if (externalReference) {
            await processSaasPayment(externalReference, 'MERCADOPAGO', paymentId);
          }
        }
      } else {
        console.error('[WEBHOOK MP SAAS] Falha ao buscar pagamento no MP:', await mpResponse.text());
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[WEBHOOK MP SAAS ERROR]', error);
    return NextResponse.json({ success: false, error: 'Erro no webhook MP' }, { status: 500 });
  }
}
