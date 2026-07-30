import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Missing Tenant ID' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const config = await db.query.paymentKeys.findFirst({
      where: and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.isActive, true))
    });

    if (!config) {
      return NextResponse.json({ success: false, error: 'No active payment configuration' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching payment config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Missing Tenant ID' }, { status: 401 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { pixExpirationTime, cardExpirationTime } = await req.json();

    const updateData: any = { updatedAt: new Date() };
    if (pixExpirationTime !== undefined) updateData.pixExpirationTime = pixExpirationTime;
    if (cardExpirationTime !== undefined) updateData.cardExpirationTime = cardExpirationTime;

    const updated = await db.update(paymentKeys)
      .set(updateData)
      .where(and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.isActive, true)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: 'No active payment configuration found to update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating payment config:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
