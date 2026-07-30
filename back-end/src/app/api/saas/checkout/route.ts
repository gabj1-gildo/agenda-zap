import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans, systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findOrCreateAsaasCustomer, createAsaasSaasSubscription, createAsaasSaasCharge } from '@/services/payments/asaas/saas';
import { createMercadoPagoSaasPreference } from '@/services/payments/mercadopago/saas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, document, phone, planId, method } = body;

    if (!name || !email || !document || !phone || !planId || !method) {
      return NextResponse.json({ success: false, error: 'Dados incompletos para o checkout' }, { status: 400 });
    }

    // Busca o Plano
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId)
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plano não encontrado' }, { status: 404 });
    }

    const amount = Number(plan.price);
    const interval = plan.interval; // 'monthly', 'yearly', 'semiannual'

    // Busca o Teto de Roteamento do PIX
    const thresholdSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'pix_routing_threshold')
    });
    const pixThreshold = thresholdSetting ? Number(thresholdSetting.value) : 100;

    // Constrói a Referência Externa para o Webhook
    const externalReference = JSON.stringify({
      n: name,
      e: email,
      d: document,
      p: phone,
      pl: planId,
      t: Date.now() // Timestamp
    });

    const description = `Plano ${plan.name} - Agenda Zap`;

    let paymentUrl = '';

    // 1. ROTEAMENTO: CARTÃO DE CRÉDITO (Exclusivo Asaas)
    if (method === 'CREDIT_CARD') {
      const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
      
      if (interval === 'monthly') {
        // Mensal = Assinatura (Recorrente)
        const sub = await createAsaasSaasSubscription(customerId, amount, externalReference, description);
        paymentUrl = sub.invoiceUrl;
      } else {
        // Anual/Semestral = Cobrança Única Parcelável
        const charge = await createAsaasSaasCharge(customerId, amount, externalReference, description, interval === 'yearly' ? 12 : 6);
        paymentUrl = charge.invoiceUrl;
      }
    } 
    
    // 2. ROTEAMENTO: BOLETO (Asaas)
    else if (method === 'BOLETO') {
      const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
      // Boleto também pode ser recorrente ou único dependendo do plano, mas vamos usar cobrança única/assinatura igual o cartão
      if (interval === 'monthly') {
        const sub = await createAsaasSaasSubscription(customerId, amount, externalReference, description);
        paymentUrl = sub.invoiceUrl;
      } else {
        const charge = await createAsaasSaasCharge(customerId, amount, externalReference, description, 1);
        paymentUrl = charge.invoiceUrl;
      }
    }

    // 3. ROTEAMENTO: PIX (Inteligente por Teto Financeiro)
    else if (method === 'PIX') {
      if (amount <= pixThreshold) {
        // Vai pelo Mercado Pago (Checkout Pro/Preference que suporta PIX nativamente)
        const pref = await createMercadoPagoSaasPreference(email, name, document, amount, description, externalReference);
        paymentUrl = pref.initPoint;
      } else {
        // Vai pelo Asaas
        const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
        if (interval === 'monthly') {
          const sub = await createAsaasSaasSubscription(customerId, amount, externalReference, description);
          paymentUrl = sub.invoiceUrl;
        } else {
          const charge = await createAsaasSaasCharge(customerId, amount, externalReference, description, 1);
          paymentUrl = charge.invoiceUrl;
        }
      }
    } else {
      return NextResponse.json({ success: false, error: 'Método de pagamento inválido' }, { status: 400 });
    }

    if (!paymentUrl) {
      return NextResponse.json({ success: false, error: 'Falha ao obter link de pagamento' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { paymentUrl } });

  } catch (error: any) {
    console.error('[SAAS CHECKOUT ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no checkout' }, { status: 500 });
  }
}
