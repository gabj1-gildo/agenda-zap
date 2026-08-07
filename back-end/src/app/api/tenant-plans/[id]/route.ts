import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { tenantPlans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    let updatedPlan: any = null;
    await withTenant(tenantId, async (tx) => {
      const updated = await tx.update(tenantPlans)
        .set({
          name: body.name !== undefined ? body.name : undefined,
          description: body.description !== undefined ? body.description : undefined,
          type: body.type !== undefined ? body.type : undefined,
          durationDays: body.durationDays !== undefined ? (body.durationDays ? parseInt(body.durationDays, 10) : null) : undefined,
          price: body.price !== undefined ? body.price.toString() : undefined,
          maxInstallments: body.maxInstallments !== undefined ? parseInt(body.maxInstallments, 10) : undefined,
          interestAbsorption: body.interestAbsorption !== undefined ? body.interestAbsorption : undefined,
          updatedAt: new Date()
        })
        .where(and(eq(tenantPlans.id, (await params).id), eq(tenantPlans.tenantId, tenantId)))
        .returning();
      updatedPlan = updated[0];
    });

    if (!updatedPlan) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedPlan });
  } catch (error: any) {
    console.error('Error updating tenant plan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let deletedPlan: any = null;
    await withTenant(tenantId, async (tx) => {
      const deleted = await tx.delete(tenantPlans)
        .where(and(eq(tenantPlans.id, (await params).id), eq(tenantPlans.tenantId, tenantId)))
        .returning();
      deletedPlan = deleted[0];
    });

    if (!deletedPlan) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: deletedPlan });
  } catch (error: any) {
    console.error('Error deleting tenant plan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
