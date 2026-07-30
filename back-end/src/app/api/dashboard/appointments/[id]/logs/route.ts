import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { appointmentLogs } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || req.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const logs = await withTenant(tenantId, async (tx) => {
      return await tx.query.appointmentLogs.findMany({
        where: and(
          eq(appointmentLogs.tenantId, tenantId),
          eq(appointmentLogs.appointmentId, id)
        ),
        orderBy: [desc(appointmentLogs.createdAt)]
      });
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Error fetching appointment logs:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
