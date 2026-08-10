import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

// POST /api/clients — create new client/lead
export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { name, phone, funnelStage } = await req.json();

    if (!phone || !phone.trim()) {
      return NextResponse.json({ success: false, error: 'Telefone é obrigatório' }, { status: 400 });
    }

    const normalizedPhone = phone.trim().replace(/\D/g, '');

    // Check for duplicate phone in this tenant
    const [existing] = await db.select().from(clients)
      .where(and(eq(clients.phone, normalizedPhone), eq(clients.tenantId, tenantId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ success: false, error: 'Já existe um cliente com este telefone' }, { status: 409 });
    }

    const validStages = ['espera', 'atendimento_ia', 'atendimento_humano', 'aguardando_pagamento', 'finalizado', 'perdido'];
    const stage = validStages.includes(funnelStage) ? funnelStage : 'espera';

    const [newClient] = await db.insert(clients).values({
      phone: normalizedPhone,
      name: name?.trim() || null,
      funnelStage: stage,
      tenantId,
      status: 'Ativo',
    }).returning();

    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[POST /api/clients] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
