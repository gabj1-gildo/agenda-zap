import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userTenants, tenants, refreshTokens } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redis } from '@/lib/redis';
import { env } from '@/config/env';

const JWT_SECRET = env.JWT_SECRET;

export async function POST(req: Request) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Rate Limiting
    const rateLimitKey = `ratelimit:refresh:${ipAddress}`;
    const requestCount = await redis.incr(rateLimitKey);
    
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 60); // Define expiração para 60 segundos
    }

    if (requestCount > 20) {
      return NextResponse.json({ success: false, message: 'Too Many Requests' }, { status: 429 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Refresh token não fornecido.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token no banco
    const [storedToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).limit(1);

    if (!storedToken) {
      return NextResponse.json({ success: false, message: 'Token inválido.' }, { status: 401 });
    }

    // Detecção de reuso de token (Token já foi revogado)
    if (storedToken.revokedAt) {
      // Indício de roubo: Revogar todos os tokens ativos do usuário
      await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.userId, storedToken.userId), isNull(refreshTokens.revokedAt)));
      return NextResponse.json({ success: false, message: 'Sessão revogada por motivo de segurança.' }, { status: 401 });
    }

    // Verificar se expirou
    if (new Date() > storedToken.expiresAt) {
      return NextResponse.json({ success: false, message: 'Token expirado.' }, { status: 401 });
    }

    // Buscar usuário e recarregar dados
    const [user] = await db.select().from(users).where(eq(users.id, storedToken.userId)).limit(1);
    
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: 'Usuário inativo.' }, { status: 401 });
    }

    // Buscar empresas
    const userTenantsList = await db
      .select({ id: tenants.id, name: tenants.name, permissions: userTenants.permissions })
      .from(userTenants)
      .innerJoin(tenants, eq(userTenants.tenantId, tenants.id))
      .where(eq(userTenants.userId, user.id));

    // Emitir novos tokens
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenants: userTenantsList,
      status: user.status,
      mustResetPassword: user.mustResetPassword,
    };

    const newAccessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    
    const plainNewRefreshToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(plainNewRefreshToken).digest('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    const newId = crypto.randomUUID();

    // Transaction para garantir consistência na rotação
    await db.transaction(async (tx) => {
      // Insere o novo
      await tx.insert(refreshTokens).values({
        id: newId,
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
        ipAddress,
        userAgent,
      });

      // Revoga o antigo apontando para o novo
      await tx.update(refreshTokens)
        .set({ revokedAt: new Date(), replacedBy: newId })
        .where(eq(refreshTokens.id, storedToken.id));
    });

    return NextResponse.json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: plainNewRefreshToken,
        user: tokenPayload,
      }
    });

  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ success: false, message: 'Erro interno.' }, { status: 500 });
  }
}
