import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { schedules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || req.headers.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const allSchedules = await withTenant(tenantId, async (tx) => {
      return tx.query.schedules.findMany({
        where: eq(schedules.tenantId, tenantId)
      });
    });

    return NextResponse.json({ success: true, data: allSchedules });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { scheduleId, isActive } = body;

    if (!scheduleId || isActive === undefined) {
      return NextResponse.json({ success: false, error: 'Missing scheduleId or isActive' }, { status: 400 });
    }

    // Verify ownership using dbAdmin because we don't know the tenantId yet!
    const { dbAdmin } = await import('@/db/withTenant');
    const schedule = await dbAdmin.query.schedules.findFirst({
      where: eq(schedules.id, scheduleId)
    });
    
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    
    if (!canAccessTenant(user, schedule.tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updated = await withTenant(schedule.tenantId, async (tx) => {
      const result = await tx.update(schedules)
        .set({ isActive })
        .where(eq(schedules.id, scheduleId))
        .returning();
        
      return { success: true, data: result[0] };
    });

    return NextResponse.json({ success: true, data: updated.data });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
