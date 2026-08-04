import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { env } from '@/config/env';
import { sendWhatsAppMessage } from '@/services/evolutionApi';

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

    // Buscar instância padrão configurada no banco (painel admin)
    const { db } = await import('@/db');
    const { systemSettings } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const instanceSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_instance_name')
    });
    const instanceName = instanceSetting?.value || undefined;

    // Enviar via WhatsApp
    const text = `Olá${name ? ' ' + name : ''}! Seu código de confirmação para finalizar a assinatura no *AgendaZap* é:\n\n*${otpCode}*\n\nEste código é válido por 10 minutos.`;
    
    const sent = await sendWhatsAppMessage(phone, text, instanceName);

    if (!sent) {
      // Fallback para testes: se a Evolution API não estiver configurada, permitimos seguir com o fluxo
      // O código ficará no Redis e será impresso no log do servidor
      console.warn(`[OTP FALLBACK] Evolution API falhou. O código gerado para ${phone} foi: ${otpCode}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Código mockado (Evolution API falhou/não configurada). Verifique os logs do servidor.',
        isMock: true
      });
    }

    return NextResponse.json({ success: true, message: 'Código enviado com sucesso' });

  } catch (error: any) {
    console.error('[OTP ERROR]', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao processar OTP' }, { status: 500 });
  }
}
