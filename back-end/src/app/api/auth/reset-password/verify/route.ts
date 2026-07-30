import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Email and code are required' }, { status: 400 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (!userRecord) {
      return NextResponse.json({ success: false, error: 'Invalid code or email' }, { status: 400 });
    }

    if (userRecord.resetToken !== code) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
    }

    if (!userRecord.resetTokenExpires || userRecord.resetTokenExpires < new Date()) {
      return NextResponse.json({ success: false, error: 'Code has expired' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Code is valid' });
  } catch (error: any) {
    console.error('Password reset verify error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
