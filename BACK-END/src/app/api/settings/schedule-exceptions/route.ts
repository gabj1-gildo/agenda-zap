import { NextResponse } from 'next/server';
import { db } from '@/db';
import { scheduleExceptions } from '@/db/schema/scheduleExceptions';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const exceptions = await db.query.scheduleExceptions.findMany({
      where: eq(scheduleExceptions.tenantId, tenantId),
      orderBy: (exc, { asc }) => [asc(exc.date)]
    });

    return NextResponse.json({ success: true, data: exceptions });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    if (!body.date) {
      return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
    }

    const [newException] = await db.insert(scheduleExceptions).values({
      tenantId,
      date: body.date,
      isClosed: body.isClosed ?? false,
      customStartTime: body.customStartTime || null,
      customEndTime: body.customEndTime || null,
    }).returning();

    return NextResponse.json({ success: true, data: newException });
  } catch (error) {
    console.error("POST Exception Error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { id, date, isClosed, customStartTime, customEndTime } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Exception ID is required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (date !== undefined) updateData.date = date;
    if (isClosed !== undefined) updateData.isClosed = isClosed;
    if (customStartTime !== undefined) updateData.customStartTime = customStartTime;
    if (customEndTime !== undefined) updateData.customEndTime = customEndTime;

    const [updatedException] = await db.update(scheduleExceptions)
      .set(updateData)
      .where(and(eq(scheduleExceptions.id, id), eq(scheduleExceptions.tenantId, tenantId)))
      .returning();

    if (!updatedException) return NextResponse.json({ success: false, error: 'Exception not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedException });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Exception ID is required' }, { status: 400 });

    await db.delete(scheduleExceptions)
      .where(and(eq(scheduleExceptions.id, id), eq(scheduleExceptions.tenantId, tenantId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
