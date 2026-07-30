import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { otp, newEmail } = await req.json();
    if (!otp || !newEmail) {
      return NextResponse.json({ success: false, error: 'Código e e-mail são obrigatórios' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.id));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!user.resetToken || !user.resetTokenExpires) {
      return NextResponse.json({ success: false, error: 'Nenhum código foi solicitado' }, { status: 400 });
    }

    if (new Date() > user.resetTokenExpires) {
      return NextResponse.json({ success: false, error: 'O código expirou. Solicite novamente.' }, { status: 400 });
    }

    const expectedStr = `${otp}:${newEmail.toLowerCase()}`;
    if (user.resetToken !== expectedStr) {
      return NextResponse.json({ success: false, error: 'Código inválido ou e-mail não confere.' }, { status: 400 });
    }

    // Success! Update email and clear token
    await db.update(users).set({ 
      email: newEmail.toLowerCase(),
      resetToken: null,
      resetTokenExpires: null,
      updatedAt: new Date()
    }).where(eq(users.id, session.id));

    return NextResponse.json({ success: true, message: 'E-mail atualizado' });
  } catch (error: any) {
    console.error('Error confirming email change:', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao confirmar e-mail.' }, { status: 500 });
  }
}
