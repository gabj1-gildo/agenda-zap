import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function PATCH(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPin, newPin } = await req.json();
    if (!currentPin || !newPin || newPin.length !== 6) {
      return NextResponse.json({ success: false, error: 'O PIN deve ter exatos 6 dígitos.' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.id));
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Apenas Superadmins podem configurar um PIN.' }, { status: 403 });
    }

    let isPinValid = false;
    
    if (!user.pin) {
      isPinValid = true; // Para o primeiro setup
    } else {
      if (user.pin.startsWith('$argon2')) {
        isPinValid = await verifyPassword(user.pin, currentPin);
      } else {
        isPinValid = user.pin === currentPin;
      }
    }

    if (!isPinValid) {
      return NextResponse.json({ success: false, error: 'PIN atual incorreto.' }, { status: 403 });
    }

    const hashedPin = await hashPassword(newPin);

    await db.update(users)
      .set({ pin: hashedPin })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, message: 'PIN atualizado com sucesso' });

  } catch (error: any) {
    console.error('Error updating PIN:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

