import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/services/emailService';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export async function POST(req: Request) {
  try {
    const { email, channel } = await req.json();

    if (!email || !channel) {
      return NextResponse.json({ success: false, error: 'Email and channel are required' }, { status: 400 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (!userRecord) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ success: true, message: 'If the email exists, a code was sent.' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.update(users)
      .set({ resetToken, resetTokenExpires })
      .where(eq(users.id, userRecord.id));

    if (channel === 'email') {
      await sendEmail({
        to: userRecord.email,
        subject: 'Código de Recuperação de Senha - AgendaZap',
        html: `<p>Olá ${userRecord.name || ''},</p><p>Seu código de recuperação de senha é: <strong>${resetToken}</strong></p><p>Este código expira em 15 minutos.</p>`,
      });
    } else if (channel === 'whatsapp') {
      if (!userRecord.phone) {
        return NextResponse.json({ success: false, error: 'Usuário não possui telefone cadastrado' }, { status: 400 });
      }

      // Fetch global whatsapp instance setting
      const instanceSetting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, 'whatsapp_default_instance_name')
      });
      
      const instanceName = instanceSetting?.value || 'whatsapp-vendas';

      const cleanPhone = userRecord.phone.replace(/\D/g, '');
      const message = `Olá ${userRecord.name || ''}, seu código de recuperação de senha é: *${resetToken}*\n\nEste código expira em 15 minutos.`;

      const sent = await sendWhatsAppMessage(
        `${cleanPhone}@s.whatsapp.net`, 
        message,
        instanceName
      );

      if (!sent) {
        return NextResponse.json({ success: false, error: 'Falha ao enviar WhatsApp' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid channel' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Code sent successfully' });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
