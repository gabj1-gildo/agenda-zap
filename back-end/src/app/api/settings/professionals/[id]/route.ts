import { NextResponse } from 'next/server';
import { db } from '@/db';
import { professionals, professionalServices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const updateData: any = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.userId !== undefined) updateData.userId = body.userId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [updated] = await db.update(professionals)
      .set(updateData)
      .where(and(eq(professionals.id, id), eq(professionals.tenantId, tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ success: false, error: 'Professional not found' }, { status: 404 });

    if (body.serviceIds && Array.isArray(body.serviceIds)) {
      await db.delete(professionalServices).where(eq(professionalServices.professionalId, id));
      for (const svcId of body.serviceIds) {
        await db.insert(professionalServices).values({ professionalId: id, serviceId: svcId });
      }
    }

    return NextResponse.json({ success: true, data: { ...updated, serviceIds: body.serviceIds } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await db.delete(professionals).where(and(eq(professionals.id, id), eq(professionals.tenantId, tenantId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
