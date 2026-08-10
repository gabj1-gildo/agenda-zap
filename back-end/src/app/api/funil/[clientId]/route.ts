import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

// PATCH /api/funil/[clientId] — update funnel stage
export async function PATCH(req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { funnelStage } = await req.json();

    const validStages = ['espera', 'atendimento_ia', 'atendimento_humano', 'aguardando_pagamento', 'finalizado', 'perdido'];
    if (!validStages.includes(funnelStage)) {
      return NextResponse.json({ success: false, error: 'Invalid funnel stage' }, { status: 400 });
    }

    const [updated] = await db.update(clients)
      .set({ funnelStage, updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[PATCH /api/funil/[clientId]] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
