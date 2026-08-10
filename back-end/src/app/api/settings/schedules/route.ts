import { NextResponse } from 'next/server';
import { db } from '@/db';
import { schedules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { tenants } from '@/db/schema';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });


    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    
    const tenantSchedules = await db.query.schedules.findMany({
      where: eq(schedules.tenantId, tenant.id),
      orderBy: (sched, { asc }) => [asc(sched.dayOfWeek)]
    });
    
    return NextResponse.json({ success: true, data: tenantSchedules });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[GET /api/settings/schedules] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });


    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });

    const body = await req.json();
    if (!Array.isArray(body.schedules)) {
      return NextResponse.json({ success: false, error: 'Expected array of schedules' }, { status: 400 });
    }

    // Replace all schedules
    await db.delete(schedules).where(eq(schedules.tenantId, tenant.id));

    const newSchedules = body.schedules.map((s: any) => ({
      tenantId: tenant.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      intervalStartTime: s.intervalStartTime || null,
      intervalEndTime: s.intervalEndTime || null,
      slotDuration: s.slotDuration || 30,
      isActive: s.isActive ?? true,
    }));

    if (newSchedules.length > 0) {
      await db.insert(schedules).values(newSchedules);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[PUT /api/settings/schedules] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
