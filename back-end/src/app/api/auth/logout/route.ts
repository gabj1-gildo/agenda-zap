import { NextResponse } from 'next/server';
import { db } from '@/db';
import { refreshTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ success: true }); // Ignorar
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, message: 'Erro interno.' }, { status: 500 });
  }
}
