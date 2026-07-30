import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
      createdAt: tenants.createdAt,
      deletedAt: tenants.deletedAt,
    }).from(tenants);

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
    const { name, phone, maxUsers, activePlan, paymentStatus, superAdminPin } = body;

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
      paymentStatus: paymentStatus || 'ACTIVE'
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
    const { id, name, phone, maxUsers, activePlan, paymentStatus, superAdminPin } = body;

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
      paymentStatus: paymentStatus || 'ACTIVE'
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
