import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import argon2 from 'argon2';
import { systemSettings } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { newPhone, currentPassword } = await req.json();
    if (!currentPassword) {
      return NextResponse.json({ success: false, error: 'Senha atual Ã© obrigatÃ³ria' }, { status: 400 });
    }
    if (!newPhone || typeof newPhone !== 'string' || newPhone.trim() === '') {
      return NextResponse.json({ success: false, error: 'NÃºmero de telefone invÃ¡lido' }, { status: 400 });
    }

    // Clean phone number
    const cleanPhone = newPhone.replace(/\D/g, '');

    const [user] = await db.select().from(users).where(eq(users.id, session.id));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Senha atual incorreta' }, { status: 400 });
    }
    
    if (user.phone && cleanPhone === user.phone.replace(/\D/g, '')) {
      return NextResponse.json({ success: false, error: 'O novo telefone Ã© igual ao atual' }, { status: 400 });
    }

    // Check if new phone is already in use by another user
    const [existing] = await db.select().from(users).where(eq(users.phone, cleanPhone));
    if (existing) {
      return NextResponse.json({ success: false, error: 'Este telefone jÃ¡ estÃ¡ em uso por outro usuÃ¡rio' }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenStr = `PHONE:${otp}:${cleanPhone}`;
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.update(users).set({ 
      resetToken: tokenStr, 
      resetTokenExpires: expires 
    }).where(eq(users.id, session.id));

    const instanceSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'whatsapp_default_instance_name')
    });
    const instanceName = instanceSetting?.value || undefined;

    const message = `OlÃ¡ ${user.name},\n\nVocÃª solicitou a alteraÃ§Ã£o do seu nÃºmero de telefone de acesso na AgendaZap.\n\nSeu cÃ³digo de confirmaÃ§Ã£o Ã©: *${otp}*\n\nEste cÃ³digo expira em 15 minutos. Se vocÃª nÃ£o solicitou esta alteraÃ§Ã£o, desconsidere esta mensagem.`;
    // Uses system wide whatsapp service, since tenant may not exist
    const sent = await sendWhatsAppMessage(`${cleanPhone}@s.whatsapp.net`, message, undefined);

    if (!sent) {
      return NextResponse.json({ success: false, error: 'Erro ao enviar mensagem via WhatsApp. Verifique se o nÃºmero estÃ¡ correto e se o sistema estÃ¡ conectado.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'CÃ³digo enviado via WhatsApp' });
  } catch (error: any) {
    console.error('Error requesting phone change:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao solicitar alteraÃ§Ã£o.' }, { status: 500 });
  }
}
