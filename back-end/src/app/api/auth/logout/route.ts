import { NextResponse } from 'next/server';
import { db } from '@/db';
import { refreshTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { token, accessToken } = await req.json();
    if (!token && !accessToken) {
      return NextResponse.json({ success: true }); // Ignorar
    }

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, tokenHash));
    }
    
    if (accessToken) {
      const accessHash = crypto.createHash('sha256').update(accessToken).digest('hex');
      await redis.set(`bl_${accessHash}`, '1', { ex: 900 }); // 15 minutos (TTL do JWT)
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, message: 'Erro interno.' }, { status: 500 });
  }
}
