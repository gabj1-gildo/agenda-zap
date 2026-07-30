import { NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema/services';
import { plans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const tenantServices = await db.query.services.findMany({
      where: eq(services.tenantId, tenantId),
      orderBy: (svc, { desc }) => [desc(svc.createdAt)]
    });

    return NextResponse.json({ success: true, data: tenantServices });
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
    if (!body.name || body.price === undefined) {
      return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 });
    }

    // Removed SaaS Limit Check as services are now unlimited
    
    const [newService] = await db.insert(services).values({
      tenantId,
      name: body.name,
      description: body.description || null,
      price: body.price,
      durationMinutes: body.durationMinutes || 30,
      isActive: body.isActive ?? true,
    }).returning();

    return NextResponse.json({ success: true, data: newService });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
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
    const { id, name, description, price, durationMinutes, isActive } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedService] = await db.update(services)
      .set(updateData)
      .where(and(eq(services.id, id), eq(services.tenantId, tenantId)))
      .returning();

    if (!updatedService) return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedService });
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

    if (!id) return NextResponse.json({ success: false, error: 'Service ID is required' }, { status: 400 });

    await db.delete(services)
      .where(and(eq(services.id, id), eq(services.tenantId, tenantId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
