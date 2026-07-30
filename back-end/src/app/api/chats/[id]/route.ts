import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    
    if (status !== 'ACTIVE' && status !== 'HUMAN') {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }
    const tenantId = req.headers.get('x-tenant-id') || req.headers.get('x-user-tenant') || req.headers.get('tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const [updatedSession] = await db.update(chatSessions)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(chatSessions.id, id), eq(chatSessions.tenantId, tenantId)))
      .returning();

    if (!updatedSession) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const { clients } = await import('@/db/schema');
    await db.update(clients)
      .set({ funnelStage: status === 'HUMAN' ? 'atendimento_humano' : 'atendimento_ia', updatedAt: new Date() })
      .where(eq(clients.id, updatedSession.clientId));

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error('Failed to update chat session:', error);
    return NextResponse.json({ success: false, error: 'Failed to update session' }, { status: 500 });
  }
}
