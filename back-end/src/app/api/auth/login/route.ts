import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, auditLogs, userTenants, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { verifyPassword } from '@/lib/password';
import crypto from 'crypto';
import { refreshTokens } from '@/db/schema';
import { env } from '@/config/env';

const JWT_SECRET = env.JWT_SECRET;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!normalizedEmail || !password) {
      return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Consultar exclusivamente a tabela users
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    if (!user) {
      // Registrar falha de auditoria sem userId
      await db.insert(auditLogs).values({
        email: normalizedEmail,
        eventType: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Verificar bloqueio por força bruta
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      await db.insert(auditLogs).values({
        userId: user.id,
        email: normalizedEmail,
        eventType: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Verificar status
    if (user.status !== 'ACTIVE') {
      await db.insert(auditLogs).values({
        userId: user.id,
        email: normalizedEmail,
        eventType: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Validar senha
    const isValid = await verifyPassword(user.passwordHash, password);

    if (!isValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: newAttempts };
      
      if (newAttempts >= MAX_ATTEMPTS) {
        updates.lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60000);
      }
      
      await db.update(users).set(updates).where(eq(users.id, user.id));
      
      await db.insert(auditLogs).values({
        userId: user.id,
        email: normalizedEmail,
        eventType: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
      });
      
      return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Sucesso: zerar tentativas
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
    }).where(eq(users.id, user.id));

    // Auditoria sucesso
    await db.insert(auditLogs).values({
      userId: user.id,
      email: normalizedEmail,
      eventType: 'LOGIN_SUCCESS',
      ipAddress,
      userAgent,
    });

    // Buscar empresas associadas (caso TENANT)
    const userTenantsData = await db
      .select({ id: tenants.id, name: tenants.name, logoUrl: tenants.logoUrl, permissions: userTenants.permissions })
      .from(userTenants)
      .innerJoin(tenants, eq(userTenants.tenantId, tenants.id))
      .where(eq(userTenants.userId, user.id));

    const userTenantsList = userTenantsData;

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      tenants: userTenantsList,
      status: user.status,
      mustResetPassword: user.mustResetPassword,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

    // Gerar Refresh Token
    const plainRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainRefreshToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    await db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        refreshToken: plainRefreshToken,
        user: tokenPayload,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 500 });
  }
}
