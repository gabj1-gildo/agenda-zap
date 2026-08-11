import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { notes } = await req.json();
    
    const tenantId = req.headers.get('x-tenant-id') || req.headers.get('x-user-tenant') || req.headers.get('tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Buscar a sessão para manter o contexto atual
    const session = await db.query.chatSessions.findFirst({
      where: and(eq(chatSessions.id, id), eq(chatSessions.tenantId, tenantId))
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Merge notes with existing context
    const currentContext = (session.context as Record<string, any>) || {};
    const newContext = { ...currentContext, notes };

    const [updatedSession] = await db.update(chatSessions)
      .set({ context: newContext })
      .where(and(eq(chatSessions.id, id), eq(chatSessions.tenantId, tenantId)))
      .returning();

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error('Failed to update chat notes:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notes' }, { status: 500 });
  }
}
