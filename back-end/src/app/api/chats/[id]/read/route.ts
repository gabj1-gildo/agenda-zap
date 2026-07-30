import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('tenant-id') || headersList.get('x-tenant-id');
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;

    if (!tenantId || !sessionId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or missing session ID' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await db.update(chatSessions)
      .set({ hasUnread: false })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.tenantId, tenantId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
