import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans, systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findOrCreateAsaasCustomer, createAsaasSaasCreditCardPayment, createAsaasSaasCharge, createAsaasSaasSubscription } from '@/services/payments/asaas/saas';
import { createMercadoPagoPixPayment, createMercadoPagoSaasSubscription } from '@/services/payments/mercadopago/saas';
import { Redis } from '@upstash/redis';
import { env } from '@/config/env';
import { sendEmail } from '@/services/emailService';
import { sendWhatsAppMessage } from '@/services/evolutionApi';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL!,
  token: env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, email, document, phone, planId, method, otpCode, 
      creditCard, creditCardHolderInfo, creditCardToken, installments 
    } = body;

    // Apenas os dados básicos são cobrados de cara. O resto validamos conforme método.
    if (!name || !email || !document || !phone || !planId || !method || (!otpCode && (method === 'CREDIT_CARD'))) {
      // BOLETO e PIX podem não enviar OTP (dependendo do frontend) mas se a verificação é feita no backend, vamos tolerar OTP apenas para Cartão ou se o frontend enviar.
      // O frontend agora envia para PIX e BOLETO direto sem OTP, então:
    }

    if (method === 'CREDIT_CARD') {
      if (!otpCode) {
        return NextResponse.json({ success: false, error: 'Código de verificação é obrigatório para cartão' }, { status: 400 });
      }
      // Validação do OTP
      const savedOtp = await redis.get(`checkout_otp:${phone}`);
      if (!savedOtp || String(savedOtp) !== String(otpCode)) {
        return NextResponse.json({ success: false, error: 'Código de verificação inválido ou expirado' }, { status: 400 });
      }
    }

    // Busca o Plano
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId)
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plano não encontrado' }, { status: 404 });
    }

    const amount = Number(plan.price);
    const interval = plan.interval; 
    const isMonthly = interval === 'monthly';

    // Constrói a Referência Externa para o Webhook
    const externalReference = JSON.stringify({
      n: name,
      e: email,
      d: document,
      p: phone,
      pl: planId,
      t: Date.now(),
      c4: creditCard?.number?.slice(-4) || creditCard?.last4 || '',
      cb: 'CREDIT_CARD' // marca genérica se n enviada
    });

    const description = `Plano ${plan.name} - Agenda Zap`;

    // 1. ROTEAMENTO: CARTÃO DE CRÉDITO
    if (method === 'CREDIT_CARD') {
      let savedLast4 = '';
      let savedBrand = '';
      
      if (creditCardToken) {
        // Obter last4 se vier do payload ou extrair do token (MP envia no creditCardToken? Não, não temos info. Vamos confiar no frontend)
      }
      
      if (creditCard) {
        savedLast4 = creditCard.number?.slice(-4) || '';
        savedBrand = 'unknown'; // Opcionalmente podemos inferir
      }

      if (isMonthly) {
        // ASSINATURA MENSAL -> MERCADO PAGO
        if (!creditCardToken) {
          return NextResponse.json({ success: false, error: 'Token do cartão não fornecido para assinatura' }, { status: 400 });
        }
        if (!plan.mpPlanId) {
          return NextResponse.json({ success: false, error: 'Plano do Mercado Pago não configurado no banco de dados' }, { status: 400 });
        }

        const mpRes = await createMercadoPagoSaasSubscription(email, creditCardToken, plan.mpPlanId, externalReference);
        
        // Atualizar assinatura no BD para salvar last4
        if (creditCard && creditCard.number) {
           await db.update(systemSettings).set({}); // workaround, na verdade fazemos update no webhook
        }

      } else {
        // VENDA ÚNICA ANUAL/SEMESTRAL -> ASAAS
        if (!creditCard || !creditCardHolderInfo) {
          return NextResponse.json({ success: false, error: 'Dados do cartão incompletos para o Asaas' }, { status: 400 });
        }

        const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
        await createAsaasSaasCreditCardPayment(
          customerId, amount, externalReference, description, 
          creditCard, creditCardHolderInfo, interval, installments || 1
        );
      }
      
      // Deletar OTP após uso
      await redis.del(`checkout_otp:${phone}`);
      
      // Salvar intenção no BD temporariamente se precisar, ou deixar o webhook fazer.
      // O ideal é o webhook atualizar a assinatura, mas o webhook não tem last4 se não enviarmos no externalReference.
      // Vamos deixar o webhook tratar isso depois. O escopo principal é a troca de plano.
      return NextResponse.json({ success: true, data: { status: 'approved' } });
    } 
    
    // 2. ROTEAMENTO: PIX
    else if (method === 'PIX') {
      const firstName = name.split(' ')[0];
      const lastName = name.split(' ').slice(1).join(' ') || firstName;
      
      let pixData: any = null;

      if (isMonthly) {
        // PIX MENSAL -> MERCADO PAGO (Transparente e imediato)
        pixData = await createMercadoPagoPixPayment(email, firstName, lastName, document, amount, description, externalReference);
      } else {
        // PIX ANUAL/SEMESTRAL -> ASAAS (Link normal)
        // Optamos por gerar um link de pagamento no Asaas que funciona como PIX
        const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
        const charge = await createAsaasSaasCharge(customerId, amount, externalReference, description, 1);
        
        // Retornamos a paymentUrl como se fosse BOLETO para o cliente abrir e pagar o PIX
        return NextResponse.json({ success: true, data: { paymentUrl: charge.invoiceUrl } });
      }
      
      // Enviar Notificações (Só para o PIX Transparente do MP)
      const emailHtml = `<h1>Seu PIX foi gerado!</h1><p>Pague o valor de R$ ${amount.toFixed(2)} utilizando a chave copia e cola abaixo:</p><br><p><strong>${pixData.qrCodeString}</strong></p><br><p>Ou escaneie o QR Code em nosso site.</p>`;
      const wppText = `Olá ${firstName}!\n\nSeu PIX para o plano *${plan.name}* foi gerado com sucesso. Valor: R$ ${amount.toFixed(2)}.\n\nCopie o código abaixo para pagar:\n\n${pixData.qrCodeString}`;
      
      sendEmail({ to: email, subject: 'Seu PIX do Agenda Zap', html: emailHtml }).catch(e => console.error('Erro Email PIX', e));
      sendWhatsAppMessage(phone, wppText).catch(e => console.error('Erro WPP PIX', e));
      
      // Deletar OTP se houver
      if (otpCode) await redis.del(`checkout_otp:${phone}`);

      return NextResponse.json({ success: true, data: { pix: pixData } });
    } 
    
    // 3. ROTEAMENTO: BOLETO
    else if (method === 'BOLETO') {
      const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
      let paymentUrl = '';
      if (isMonthly) {
        // Assinatura via Asaas para boleto mensal
        const sub = await createAsaasSaasSubscription(customerId, amount, externalReference, description);
        paymentUrl = sub.invoiceUrl;
      } else {
        // Cobrança única via Asaas para boleto anual/semestral
        const charge = await createAsaasSaasCharge(customerId, amount, externalReference, description, 1);
        paymentUrl = charge.invoiceUrl;
      }
      
      if (otpCode) await redis.del(`checkout_otp:${phone}`);
      return NextResponse.json({ success: true, data: { paymentUrl } });
    }

    return NextResponse.json({ success: false, error: 'Método de pagamento inválido' }, { status: 400 });

  } catch (error: any) {
    console.error('[SAAS CHECKOUT ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no checkout' }, { status: 500 });
  }
}
