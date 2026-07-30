import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { env } from '@/config/env';
import { sendWhatsAppMessage } from '@/services/whatsapp/evolutionApi';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL!,
  token: env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { phone, name } = await request.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Número de telefone é obrigatório' }, { status: 400 });
    }

    // Gerar código de 6 dígitos aleatório
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar no Redis com expiração de 10 minutos (600 segundos)
    const key = `checkout_otp:${phone}`;
    await redis.set(key, otpCode, { ex: 600 });

    // Enviar via WhatsApp global
    const text = `Olá${name ? ' ' + name : ''}! Seu código de confirmação para finalizar a assinatura no *AgendaZap* é:\n\n*${otpCode}*\n\nEste código é válido por 10 minutos.`;
    
    // Passando undefined no terceiro parâmetro faz a função usar a instância global (env.EVOLUTION_INSTANCE_NAME)
    const sent = await sendWhatsAppMessage(phone, text);

    if (!sent) {
      return NextResponse.json({ success: false, error: 'Falha ao enviar o código de confirmação pelo WhatsApp.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Código enviado com sucesso' });

  } catch (error: any) {
    console.error('[OTP ERROR]', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao processar OTP' }, { status: 500 });
  }
}
