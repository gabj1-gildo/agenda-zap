import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, users, userTenants } from '@/db/schema';
import { inArray, eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { verifyAuth } from '@/lib/auth';

// GET — listar todas as empresas
export async function GET(req: Request) {
  try {
    const auth = verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { role, tenants: userTenantList } = auth;

    let allTenants;
    if (role === 'SUPERADMIN') {
      // SuperAdmin vê todas as empresas
      allTenants = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          phone: tenants.phone,
          evolutionInstanceStatus: tenants.evolutionInstanceStatus,
          evolutionInstanceName: tenants.evolutionInstanceName,
          createdAt: tenants.createdAt,
          logoUrl: tenants.logoUrl,
        })
        .from(tenants);
    } else {
      // Usuário comum vê apenas suas próprias empresas
      const tenantIds = userTenantList.map((t: any) => t.id);
      
      if (tenantIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      allTenants = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          phone: tenants.phone,
          evolutionInstanceStatus: tenants.evolutionInstanceStatus,
          evolutionInstanceName: tenants.evolutionInstanceName,
          createdAt: tenants.createdAt,
          logoUrl: tenants.logoUrl,
        })
        .from(tenants)
        .where(inArray(tenants.id, tenantIds));
    }

    return NextResponse.json({ success: true, data: allTenants });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

// POST — criar nova empresa (SuperAdmin ou Lojista com plano Premium)
export async function POST(req: Request) {
  try {
    const auth = verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
    }

    const isSuperAdmin = auth.role === 'SUPERADMIN';
    const isTenant = auth.role === 'TENANT';

    if (!isSuperAdmin && !isTenant) {
      return NextResponse.json({ success: false, message: 'Permissão negada.' }, { status: 403 });
    }

    const { name, email, password, phone } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, message: 'Nome da empresa é obrigatório' }, { status: 400 });
    }

    if (isSuperAdmin && (!email || !password)) {
      return NextResponse.json({ success: false, message: 'Email e senha são obrigatórios para SuperAdmin criar conta' }, { status: 400 });
    }

    // Se for Lojista, verificar limites do plano (maxTenants)
    let userOwnerId = auth.id;
    
    if (isTenant) {
      const { userSubscriptions, plans } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      const subscription = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, auth.id),
        with: { plan: true }
      });

      if (!subscription || !subscription.plan) {
        return NextResponse.json({ success: false, error: 'Assinatura não encontrada' }, { status: 403 });
      }

      const tenantsOfUser = await db.query.userTenants.findMany({
        where: eq(userTenants.userId, auth.id)
      });

      if (tenantsOfUser.length >= subscription.plan.maxTenants) {
        return NextResponse.json({ success: false, message: `Seu plano (${subscription.plan.name}) permite no máximo ${subscription.plan.maxTenants} empresa(s). Faça upgrade para adicionar mais.` }, { status: 403 });
      }
    }

    // Drizzle Transaction
    const newTenant = await db.transaction(async (tx) => {
      // 1. Criar empresa
      const [insertedTenant] = await tx
        .insert(tenants)
        .values({
          name,
          phone: phone || null,
          evolutionInstanceStatus: 'DISCONNECTED',
        })
        .returning();

      if (isSuperAdmin) {
        // Criar usuário novo
        const normalizedEmail = email.trim().toLowerCase();
        const passwordHash = await argon2.hash(password);
        const [insertedUser] = await tx
          .insert(users)
          .values({
            name,
            email: normalizedEmail,
            passwordHash,
            role: 'TENANT',
          })
          .returning();
        userOwnerId = insertedUser.id;
      }

      // Vincular empresa ao usuário (existente ou novo)
      await tx.insert(userTenants).values({
        userId: userOwnerId,
        tenantId: insertedTenant.id,
      });

      return insertedTenant;
    });

    return NextResponse.json({ success: true, data: newTenant });
  } catch (error: any) {
    console.error("Erro ao criar tenant:", error);
    if (error.code === '23505') { // Unique violation
      return NextResponse.json({ success: false, message: 'O email já está em uso.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
