import { NextResponse } from 'next/server';
import { withTenant } from '@/db/withTenant';
import { clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { clientId, funnelStage } = body;

    if (!clientId || !funnelStage) {
      return NextResponse.json({ success: false, error: 'Missing clientId or funnelStage' }, { status: 400 });
    }

    // Check if body has tenantId
    const targetTenantId = req.headers.get('x-tenant-id') || body.tenantId || req.headers.get('tenant-id');
    if (!targetTenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    if (!canAccessTenant(user, targetTenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updated = await withTenant(targetTenantId, async (tx) => {
      const result = await tx.update(clients)
        .set({ funnelStage })
        .where(and(eq(clients.id, clientId), eq(clients.tenantId, targetTenantId)))
        .returning();
        
      if (funnelStage === 'atendimento_humano') {
        const { chatSessions } = await import('@/db/schema');
        await tx.update(chatSessions)
          .set({ status: 'HUMAN', updatedAt: new Date() })
          .where(and(eq(chatSessions.clientId, clientId), eq(chatSessions.tenantId, targetTenantId), eq(chatSessions.status, 'ACTIVE')));
      } else if (funnelStage === 'atendimento_ia') {
        const { chatSessions } = await import('@/db/schema');
        await tx.update(chatSessions)
          .set({ status: 'ACTIVE', updatedAt: new Date() })
          .where(and(eq(chatSessions.clientId, clientId), eq(chatSessions.tenantId, targetTenantId), eq(chatSessions.status, 'HUMAN')));
      }

      return result;
    });

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error('Error updating client stage:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
