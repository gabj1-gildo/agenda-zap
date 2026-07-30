import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId || tenantId === 'undefined' || tenantId === 'null') {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const sessions = await db.query.chatSessions.findMany({
      where: eq(chatSessions.tenantId, tenantId),
      with: {
        client: {
          with: {
            clientTags: {
              with: {
                tag: true
              }
            }
          }
        },
      },
      orderBy: [desc(chatSessions.updatedAt)],
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch chat sessions' }, { status: 500 });
  }
}
