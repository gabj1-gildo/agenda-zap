import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { hashPassword, generateTemporaryPassword } from '@/lib/password';
import { sendEmail } from '@/services/emailService';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = verifyAuth(req);
    if (!adminUser || adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'ID de usuário inválido' }, { status: 400 });
    }

    const targetUserRecord = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!targetUserRecord) {
      return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    await db.update(users)
      .set({ passwordHash, mustResetPassword: true, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));

    const emailSent = await sendEmail({
      to: targetUserRecord.email,
      subject: 'Nova Senha Gerada - AgendaZap',
      html: `<p>Olá ${targetUserRecord.name || ''},</p>
             <p>O administrador gerou uma nova senha para sua conta.</p>
             <p>Sua nova senha é: <strong>${tempPassword}</strong></p>
             <p>Recomendamos que você acesse o sistema e mude sua senha o mais breve possível.</p>`,
    });

    if (!emailSent.success) {
       console.error('Falha ao enviar email com nova senha:', emailSent.error);
       return NextResponse.json({ success: true, message: 'Senha gerada com sucesso, mas houve erro ao enviar e-mail.' });
    }

    return NextResponse.json({ success: true, message: 'Nova senha gerada e enviada por e-mail com sucesso' });
  } catch (error) {
    console.error('Error generating random password:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
