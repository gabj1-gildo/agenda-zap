import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, validatePassword } from '@/lib/password';

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ success: false, error: 'Email, code and newPassword are required' }, { status: 400 });
    }

    const { isValid, message } = validatePassword(newPassword);
    if (!isValid) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (!userRecord || userRecord.resetToken !== code) {
      return NextResponse.json({ success: false, error: 'Invalid code or email' }, { status: 400 });
    }

    if (!userRecord.resetTokenExpires || userRecord.resetTokenExpires < new Date()) {
      return NextResponse.json({ success: false, error: 'Code has expired' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);

    await db.update(users)
      .set({ 
        passwordHash,
        resetToken: null,
        resetTokenExpires: null
      })
      .where(eq(users.id, userRecord.id));

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Password reset update error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
