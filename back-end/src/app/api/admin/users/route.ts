import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userTenants, tenants } from '@/db/schema';
import { eq, count, and } from 'drizzle-orm';
import crypto from 'crypto';
import { verifyAuth } from '@/lib/auth';
import { hashPassword, verifyPin, generateTemporaryPassword } from '@/lib/password';
import { sendTemporaryPasswordEmail } from '@/lib/email';

// Requer autenticação! O wrapper (ou Middleware) deve proteger a rota.
// Aqui vamos simular que recebemos o userId e role via cabeçalho (que o NextAuth ou comTenant pode injetar).
// Como Next.js app router não passa o session diretamente se não usarmos getToken, vamos importar getToken ou receber headers.
//

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    
    const role = user.role;
    // Assuming the user is accessing a specific tenant context, we could pass tenantId in headers or query,
    // but we MUST NOT trust it for authorization without checking canAccessTenant.
    // For admin routes, we can still accept x-tenant-id from the client to know WHICH tenant they are viewing,
    // but we MUST verify they belong to it (if they are not SUPERADMIN).
    const tenantId = req.headers.get('x-tenant-id');

    if (!role) return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });

    let allUsers: any[] = [];

    if (role === 'SUPERADMIN') {
      // Retornar todos os usuários do sistema com seus tenants
      const dbUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      }).from(users);

      // Buscar relações
      const relations = await db.select({
        userId: userTenants.userId,
        tenantId: userTenants.tenantId,
        tenantName: tenants.name,
      })
      .from(userTenants)
      .innerJoin(tenants, eq(userTenants.tenantId, tenants.id));

      allUsers = dbUsers.map(u => ({
        ...u,
        tenants: relations.filter(r => r.userId === u.id).map(r => ({ id: r.tenantId, name: r.tenantName }))
      }));
    } else {
      // ADMIN: ver usuários que pertencem ao tenantId atual
      if (!tenantId) return NextResponse.json({ success: false, message: 'Tenant não selecionado' }, { status: 400 });
      if (!user.tenants.some(t => t.id === tenantId)) {
        return NextResponse.json({ success: false, message: 'Acesso negado a este tenant' }, { status: 403 });
      }

      const tenantUsersRelations = await db.select({
        userId: userTenants.userId,
        tenantId: userTenants.tenantId,
        tenantName: tenants.name,
      }).from(userTenants)
        .innerJoin(tenants, eq(userTenants.tenantId, tenants.id))
        .where(eq(userTenants.tenantId, tenantId));

      const userIds = tenantUsersRelations.map(r => r.userId);

      if (userIds.length === 0) {
        allUsers = [];
      } else {
        // Obter os dados desses usuários
        const dbUsers = await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        }).from(users);

        allUsers = dbUsers.filter(u => userIds.includes(u.id)).map(u => {
          const relation = tenantUsersRelations.find(r => r.userId === u.id);
          return {
            ...u,
            tenants: relation ? [{ id: relation.tenantId, name: relation.tenantName }] : []
          };
        });
      }
    }

    return NextResponse.json({ success: true, data: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });

    const role = user.role;
    const currentTenantId = req.headers.get('x-tenant-id');

    const body = await req.json();
    const { name, email, role: newRole, tenantIds, status, phone, superAdminPin } = body;

    // Se for SUPERADMIN, validar PIN
    if (role === 'SUPERADMIN') {
      if (!superAdminPin) {
        return NextResponse.json({ success: false, message: 'PIN de Segurança é obrigatório para Super Admins' }, { status: 400 });
      }
      const [dbUser] = await db.select({ pin: users.pin }).from(users).where(eq(users.id, user.id)).limit(1);
      if (!dbUser || !(await verifyPin(dbUser.pin, superAdminPin))) {
        return NextResponse.json({ success: false, message: 'PIN incorreto' }, { status: 403 });
      }
    }

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Nome e email obrigatórios' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Sempre gera senha temporária ignorando a entrada do cliente
    const tempPassword = generateTemporaryPassword();
    
    const passwordHash = await hashPassword(tempPassword);

    let assignedTenants = tenantIds || [];
    let assignedRole = newRole || 'USER';

    // Regras de negócio
    if (role === 'SUPERADMIN') {
      // Pode fazer o que quiser
      // assignedTenants vem do frontend caso ele associe o usuário a alguma empresa (opcional)
    } else {
      // ADMIN criando um funcionário
      if (!currentTenantId) return NextResponse.json({ success: false, message: 'Tenant não selecionado' }, { status: 400 });
      if (!user.tenants.some(t => t.id === currentTenantId)) return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
      
      assignedTenants = [currentTenantId];
      if (assignedRole !== 'ADMIN' && assignedRole !== 'ATTENDANT') assignedRole = 'ATTENDANT'; // Só pode criar ADMIN ou ATTENDANT

      // Checar limite de usuários do plano (maxUsers)
      const [tenantData] = await db.select({ maxUsers: tenants.maxUsers }).from(tenants).where(eq(tenants.id, currentTenantId)).limit(1);
      
      const [currentUsersCount] = await db.select({ value: count() })
        .from(userTenants)
        .innerJoin(users, eq(users.id, userTenants.userId))
        .where(
          and(
            eq(userTenants.tenantId, currentTenantId),
            eq(users.status, 'ACTIVE')
          )
        );

      if (tenantData && currentUsersCount.value >= tenantData.maxUsers) {
        return NextResponse.json({ success: false, message: `Limite de usuários atingido (${tenantData.maxUsers}). Faça um upgrade no plano.` }, { status: 403 });
      }
    }

    // Usar Transaction Drizzle
    const newUser = await db.transaction(async (tx) => {
      const id = crypto.randomUUID();
      const [insertedUser] = await tx.insert(users).values({
        id,
        name,
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        status: status || 'ACTIVE',
        phone: phone || null,
      }).returning();

      for (const tId of assignedTenants) {
        if (tId) { // check if valid
          await tx.insert(userTenants).values({
            userId: id,
            tenantId: tId
          });
        }
      }

      return insertedUser;
    });

    await sendTemporaryPasswordEmail(normalizedEmail, tempPassword);

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    if (error?.message?.includes('unique') || error?.code === '23505') {
      return NextResponse.json({ success: false, message: 'Email já cadastrado' }, { status: 409 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, message: 'Erro interno', error: error?.message, stack: error?.stack }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });

    const role = user.role;
    const currentTenantId = req.headers.get('x-tenant-id');

    const body = await req.json();
    const { id, name, email, phone, role: newRole, status, tenantIds, superAdminPin } = body;

    // Se for SUPERADMIN, validar PIN
    if (role === 'SUPERADMIN') {
      if (!superAdminPin) {
        return NextResponse.json({ success: false, message: 'PIN de Segurança é obrigatório para Super Admins' }, { status: 400 });
      }
      const [dbUser] = await db.select({ pin: users.pin }).from(users).where(eq(users.id, user.id)).limit(1);
      if (!dbUser || !(await verifyPin(dbUser.pin, superAdminPin))) {
        return NextResponse.json({ success: false, message: 'PIN incorreto' }, { status: 403 });
      }
    }

    if (!id || !name || !email) {
      return NextResponse.json({ success: false, message: 'Dados incompletos' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user belongs to this tenant if requester is ADMIN
    if (role === 'ADMIN') {
      if (!currentTenantId) return NextResponse.json({ success: false, message: 'Tenant não selecionado' }, { status: 400 });
      if (!user.tenants.some(t => t.id === currentTenantId)) return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
      
      const userTenantRel = await db.select().from(userTenants)
        .where(and(eq(userTenants.userId, id), eq(userTenants.tenantId, currentTenantId)))
        .limit(1);

      if (userTenantRel.length === 0) {
        return NextResponse.json({ success: false, message: 'Usuário não encontrado neste tenant' }, { status: 404 });
      }

      // Check maxUsers limit when re-activating a user
      if (status === 'ACTIVE') {
        const [currentUser] = await db.select({ status: users.status }).from(users).where(eq(users.id, id)).limit(1);
        if (currentUser && currentUser.status !== 'ACTIVE') {
          const [tenantData] = await db.select({ maxUsers: tenants.maxUsers }).from(tenants).where(eq(tenants.id, currentTenantId)).limit(1);
          const [currentUsersCount] = await db.select({ value: count() })
            .from(userTenants)
            .innerJoin(users, eq(users.id, userTenants.userId))
            .where(
              and(
                eq(userTenants.tenantId, currentTenantId),
                eq(users.status, 'ACTIVE')
              )
            );

          if (tenantData && currentUsersCount.value >= tenantData.maxUsers) {
            return NextResponse.json({ success: false, message: `Limite de usuários atingido (${tenantData.maxUsers}). Desative outro usuário primeiro.` }, { status: 403 });
          }
        }
      }
    }

    let assignedRole = newRole;
    if (role === 'ADMIN') {
      // ADMIN cannot upgrade a user to SUPERADMIN or set to NO_ACCESS
      if (assignedRole !== 'ADMIN' && assignedRole !== 'ATTENDANT') assignedRole = 'ATTENDANT';
    }

    const [updatedUser] = await db.update(users)
      .set({
        name,
        email: normalizedEmail,
        phone: phone || null,
        role: assignedRole,
        status: status || 'ACTIVE',
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    if (role === 'SUPERADMIN' && tenantIds !== undefined) {
      await db.delete(userTenants).where(eq(userTenants.userId, id));
      for (const tId of tenantIds) {
        if (tId) {
          await db.insert(userTenants).values({ userId: id, tenantId: tId });
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    if (error?.message?.includes('unique') || error?.code === '23505') {
      return NextResponse.json({ success: false, message: 'Email já cadastrado para outro usuário' }, { status: 409 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, message: 'Erro interno', error: error?.message }, { status: 500 });
  }
}
