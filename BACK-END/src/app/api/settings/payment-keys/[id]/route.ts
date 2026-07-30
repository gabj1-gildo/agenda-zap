import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // If making active, deactivate others
    if (body.isActive) {
      await db.update(paymentKeys)
        .set({ isActive: false })
        .where(eq(paymentKeys.tenantId, tenantId));
    }

    const [updated] = await db.update(paymentKeys)
      .set({ 
        isActive: body.isActive, 
        name: body.name,
        acceptsPix: body.acceptsPix !== undefined ? body.acceptsPix : undefined,
        acceptsCreditCard: body.acceptsCreditCard !== undefined ? body.acceptsCreditCard : undefined,
        acceptsBoleto: body.acceptsBoleto !== undefined ? body.acceptsBoleto : undefined,
        updatedAt: new Date() 
      })
      .where(and(eq(paymentKeys.id, id), eq(paymentKeys.tenantId, tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });


    await db.delete(paymentKeys)
      .where(and(eq(paymentKeys.id, id), eq(paymentKeys.tenantId, tenantId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
