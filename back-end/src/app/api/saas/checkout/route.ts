import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans, systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findOrCreateAsaasCustomer, createAsaasSaasCreditCardPayment, createAsaasSaasCharge, createAsaasSaasSubscription } from '@/services/payments/asaas/saas';
import { createMercadoPagoPixPayment } from '@/services/payments/mercadopago/saas';
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
    const { name, email, document, phone, planId, method, otpCode, creditCard, creditCardHolderInfo } = body;

    if (!name || !email || !document || !phone || !planId || !method || !otpCode) {
      return NextResponse.json({ success: false, error: 'Dados incompletos para o checkout' }, { status: 400 });
    }

    // Validação do OTP
    const savedOtp = await redis.get(`checkout_otp:${phone}`);
    if (!savedOtp || String(savedOtp) !== String(otpCode)) {
      return NextResponse.json({ success: false, error: 'Código de verificação inválido ou expirado' }, { status: 400 });
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

    // Constrói a Referência Externa para o Webhook
    const externalReference = JSON.stringify({
      n: name,
      e: email,
      d: document,
      p: phone,
      pl: planId,
      t: Date.now() 
    });

    const description = `Plano ${plan.name} - Agenda Zap`;

    // 1. ROTEAMENTO: CARTÃO DE CRÉDITO (Checkout Transparente Asaas)
    if (method === 'CREDIT_CARD') {
      if (!creditCard || !creditCardHolderInfo) {
        return NextResponse.json({ success: false, error: 'Dados do cartão incompletos' }, { status: 400 });
      }

      const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
      await createAsaasSaasCreditCardPayment(customerId, amount, externalReference, description, creditCard, creditCardHolderInfo, interval);
      
      // Deletar OTP após uso
      await redis.del(`checkout_otp:${phone}`);
      
      return NextResponse.json({ success: true, data: { status: 'approved' } });
    } 
    
    // 2. ROTEAMENTO: PIX (Checkout Transparente Mercado Pago)
    else if (method === 'PIX') {
      // Para manter a transparência e emissão imediata do QR Code, usamos o Mercado Pago (API de Pagamentos v1)
      const firstName = name.split(' ')[0];
      const lastName = name.split(' ').slice(1).join(' ') || firstName;
      
      const pixData = await createMercadoPagoPixPayment(email, firstName, lastName, document, amount, description, externalReference);
      
      // Enviar Notificações
      const emailHtml = `<h1>Seu PIX foi gerado!</h1><p>Pague o valor de R$ ${amount.toFixed(2)} utilizando a chave copia e cola abaixo:</p><br><p><strong>${pixData.qrCodeString}</strong></p><br><p>Ou escaneie o QR Code em nosso site.</p>`;
      const wppText = `Olá ${firstName}!\n\nSeu PIX para o plano *${plan.name}* foi gerado com sucesso. Valor: R$ ${amount.toFixed(2)}.\n\nCopie o código abaixo para pagar:\n\n${pixData.qrCodeString}`;
      
      // Envia de forma assíncrona para não travar a UI
      sendEmail({ to: email, subject: 'Seu PIX do Agenda Zap', html: emailHtml }).catch(e => console.error('Erro Email PIX', e));
      sendWhatsAppMessage(phone, wppText).catch(e => console.error('Erro WPP PIX', e));
      
      // Deletar OTP após uso
      await redis.del(`checkout_otp:${phone}`);

      return NextResponse.json({ success: true, data: { pix: pixData } });
    } 
    
    // 3. ROTEAMENTO: BOLETO (Asaas - Link normal)
    else if (method === 'BOLETO') {
      const customerId = await findOrCreateAsaasCustomer(name, email, document, phone);
      let paymentUrl = '';
      if (interval === 'monthly') {
        const sub = await createAsaasSaasSubscription(customerId, amount, externalReference, description);
        paymentUrl = sub.invoiceUrl;
      } else {
        const charge = await createAsaasSaasCharge(customerId, amount, externalReference, description, 1);
        paymentUrl = charge.invoiceUrl;
      }
      
      await redis.del(`checkout_otp:${phone}`);
      return NextResponse.json({ success: true, data: { paymentUrl } });
    }

    return NextResponse.json({ success: false, error: 'Método de pagamento inválido' }, { status: 400 });

  } catch (error: any) {
    console.error('[SAAS CHECKOUT ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no checkout' }, { status: 500 });
  }
}
