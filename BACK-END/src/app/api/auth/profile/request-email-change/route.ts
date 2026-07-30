import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/services/emailService';

export async function POST(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { newEmail } = await req.json();
    if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'E-mail invÃ¡lido' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.id));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'O novo e-mail Ã© igual ao atual' }, { status: 400 });
    }

    // Check if new email is already in use by another user
    const [existing] = await db.select().from(users).where(eq(users.email, newEmail.toLowerCase()));
    if (existing) {
      return NextResponse.json({ success: false, error: 'Este e-mail jÃ¡ estÃ¡ em uso' }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenStr = `${otp}:${newEmail.toLowerCase()}`;
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.update(users).set({ 
      resetToken: tokenStr, 
      resetTokenExpires: expires 
    }).where(eq(users.id, session.id));

    // Send email
    await sendEmail({
      to: newEmail.toLowerCase(),
      subject: 'AgendaZap - ConfirmaÃ§Ã£o de novo E-mail',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>ConfirmaÃ§Ã£o de AlteraÃ§Ã£o de E-mail</h2>
          <p>OlÃ¡ ${user.name},</p>
          <p>VocÃª solicitou a alteraÃ§Ã£o do seu e-mail de acesso na AgendaZap.</p>
          <p>Use o cÃ³digo de 6 dÃ­gitos abaixo para confirmar esta alteraÃ§Ã£o:</p>
          <div style="background: #f4f4f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p>Este cÃ³digo expira em 15 minutos.</p>
          <p>Se vocÃª nÃ£o solicitou esta alteraÃ§Ã£o, ignore este e-mail.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'CÃ³digo enviado' });
  } catch (error: any) {
    console.error('Error requesting email change:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao solicitar alteraÃ§Ã£o.' }, { status: 500 });
  }
}
