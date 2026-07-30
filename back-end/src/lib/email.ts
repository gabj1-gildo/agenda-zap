import { env } from '@/config/env';
import { Resend } from 'resend';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendTemporaryPasswordEmail(email: string, tempPassword: string) {
  const loginUrl = env.FRONTEND_URL || 'https://agenda-zap-frontend-cg95.onrender.com/login';
  
  if (!resend) {
    console.log('\n=============================================');
    console.log('📧 (MOCK) ENVIAR EMAIL PARA:', email);
    console.log('🔑 SENHA TEMPORÁRIA:', tempPassword);
    console.log('=============================================\n');
    return;
  }

  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Bem-vindo(a) ao AgendaZap - Sua Senha de Acesso',
      html: `
        <div style="font-family: sans-serif; max-w-xl mx-auto p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 style="color: #1a202c;">Bem-vindo(a) ao AgendaZap!</h2>
          <p style="color: #4a5568; font-size: 16px;">Sua conta foi criada com sucesso pelo administrador. Para acessar a plataforma, utilize a seguinte senha gerada automaticamente:</p>
          <div style="background-color: #edf2f7; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #2d3748; letter-spacing: 2px;">
              ${tempPassword}
            </span>
          </div>
          <p style="color: #4a5568; font-size: 16px;">Por motivos de segurança, <strong>será obrigatório redefinir esta senha no seu primeiro acesso</strong>.</p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${loginUrl}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Acessar Plataforma
            </a>
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error('Falha ao enviar email pelo Resend:', error);
  }
}
