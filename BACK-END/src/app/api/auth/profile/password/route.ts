import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import argon2 from 'argon2';

export async function PATCH(req: Request) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Senhas não fornecidas' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.id));
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Validate current password
    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Senha atual incorreta' }, { status: 400 });
    }

    // Validate new password strength
    const passValid = newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);

    if (!passValid) {
      return NextResponse.json({ success: false, error: 'Nova senha não atende aos requisitos de segurança' }, { status: 400 });
    }

    const newHash = await argon2.hash(newPassword);
    await db.update(users).set({ passwordHash: newHash, mustResetPassword: false, updatedAt: new Date() }).where(eq(users.id, session.id));

    return NextResponse.json({ success: true, message: 'Password updated' });
  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
