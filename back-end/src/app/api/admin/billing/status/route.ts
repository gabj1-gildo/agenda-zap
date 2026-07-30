import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userSubscriptions, plans } from '@/db/schema';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID missing' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, user.id),
      with: {
        plan: true
      }
    });

    // Também podemos buscar invoices pendentes para o front saber
    const { invoices } = await import('@/db/schema');
    const { and, lt } = await import('drizzle-orm');
    
    const pendingInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.userId, user.id),
        eq(invoices.status, 'PENDING')
      )
    });

    return NextResponse.json({ success: true, data: { subscription, invoices: pendingInvoices } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
