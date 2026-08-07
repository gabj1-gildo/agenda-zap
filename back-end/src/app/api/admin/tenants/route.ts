import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, users, userTenants, userSubscriptions, plans } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { verifyAuth } from '@/lib/auth';
import { verifyPin } from '@/lib/password';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const allTenants = await db.select({
      id: tenants.id,
      name: tenants.name,
      phone: tenants.phone,
      maxUsers: tenants.maxUsers,
      activePlan: tenants.activePlan,
      paymentStatus: tenants.paymentStatus,
      customMaxWhatsAppInstances: tenants.customMaxWhatsAppInstances,
      createdAt: tenants.createdAt,
      deletedAt: tenants.deletedAt,
    }).from(tenants);

    // Mapear o plano real
    const tenantIds = allTenants.map(t => t.id);
    let tenantRealPlans: Record<string, string> = {};
    if (tenantIds.length > 0) {
      const uts = await db.select({
        tenantId: userTenants.tenantId,
        userId: userTenants.userId
      }).from(userTenants).where(inArray(userTenants.tenantId, tenantIds));

      const userIds = uts.map(u => u.userId);
      if (userIds.length > 0) {
        const subs = await db.select({
          userId: userSubscriptions.userId,
          planName: plans.name,
          status: userSubscriptions.status
        })
        .from(userSubscriptions)
        .leftJoin(plans, eq(userSubscriptions.planId, plans.id))
        .where(inArray(userSubscriptions.userId, userIds));

        for (const ut of uts) {
          const sub = subs.find(s => s.userId === ut.userId && s.status === 'ACTIVE');
          if (sub && sub.planName) {
            tenantRealPlans[ut.tenantId] = sub.planName;
          }
        }
      }
    }

    allTenants.forEach(t => {
      if (tenantRealPlans[t.id]) {
        t.activePlan = tenantRealPlans[t.id].toUpperCase();
      }
    });

    // If query ?status=deleted, filter deleted
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    
    let filteredTenants = allTenants;
    if (status === 'deleted') {
      filteredTenants = allTenants.filter(t => t.deletedAt !== null);
    } else {
      filteredTenants = allTenants.filter(t => t.deletedAt === null);
    }

    return NextResponse.json({ success: true, data: filteredTenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, maxUsers, activePlan, paymentStatus, customMaxWhatsAppInstances, superAdminPin } = body;

    // Validar PIN
    if (!superAdminPin) {
      return NextResponse.json({ success: false, message: 'PIN de Segurança é obrigatório' }, { status: 400 });
    }
    const [dbUser] = await db.select({ pin: users.pin }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!dbUser || !(await verifyPin(dbUser.pin, superAdminPin))) {
      return NextResponse.json({ success: false, message: 'PIN incorreto' }, { status: 403 });
    }

    if (!name) {
      return NextResponse.json({ success: false, message: 'Nome da empresa é obrigatório' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const [newTenant] = await db.insert(tenants).values({
      id,
      name,
      phone: phone || null,
      maxUsers: maxUsers || 3,
      activePlan: activePlan || 'FREE',
      paymentStatus: paymentStatus || 'ACTIVE',
      customMaxWhatsAppInstances: customMaxWhatsAppInstances || null
    }).returning();

    return NextResponse.json({ success: true, data: newTenant }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    
    if (error.code === '23505' && error.constraint === 'tenants_phone_unique') {
      return NextResponse.json({ success: false, message: 'Já existe uma empresa com este número de telefone.' }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, phone, maxUsers, activePlan, paymentStatus, customMaxWhatsAppInstances, superAdminPin } = body;

    // Validar PIN
    if (!superAdminPin) {
      return NextResponse.json({ success: false, message: 'PIN de Segurança é obrigatório' }, { status: 400 });
    }
    const [dbUser] = await db.select({ pin: users.pin }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!dbUser || !(await verifyPin(dbUser.pin, superAdminPin))) {
      return NextResponse.json({ success: false, message: 'PIN incorreto' }, { status: 403 });
    }

    if (!id || !name) {
      return NextResponse.json({ success: false, message: 'ID e Nome são obrigatórios' }, { status: 400 });
    }

    const restore = body.restore;

    const updateData: any = {
      name,
      phone: phone || null,
      maxUsers: maxUsers || 3,
      activePlan: activePlan || 'FREE',
      paymentStatus: paymentStatus || 'ACTIVE',
      customMaxWhatsAppInstances: customMaxWhatsAppInstances || null
    };
    
    if (restore) {
      updateData.deletedAt = null;
    }

    const [updatedTenant] = await db.update(tenants)
      .set(updateData)
      .where(eq(tenants.id, id))
      .returning();

    if (!updatedTenant) {
      return NextResponse.json({ success: false, message: 'Empresa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTenant });
  } catch (error: any) {
    console.error('Error updating tenant:', error);

    if (error.code === '23505' && error.constraint === 'tenants_phone_unique') {
      return NextResponse.json({ success: false, message: 'Já existe uma empresa com este número de telefone.' }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const pin = req.headers.get('superadmin-pin');

    if (!id || !pin) {
      return NextResponse.json({ success: false, message: 'ID e PIN são obrigatórios' }, { status: 400 });
    }

    const [dbUser] = await db.select({ pin: users.pin }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!dbUser || !(await verifyPin(dbUser.pin, pin))) {
      return NextResponse.json({ success: false, message: 'PIN incorreto' }, { status: 403 });
    }

    await db.update(tenants).set({ deletedAt: new Date() }).where(eq(tenants.id, id));

    return NextResponse.json({ success: true, message: 'Empresa movida para lixeira' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
