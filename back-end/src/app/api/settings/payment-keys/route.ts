import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentKeys, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID missing' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });


    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    
    const keys = await db.query.paymentKeys.findMany({
      where: eq(paymentKeys.tenantId, tenant.id),
      orderBy: (keys, { desc }) => [desc(keys.createdAt)]
    });
    
    return NextResponse.json({ success: true, data: keys });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID missing' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });


    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });

    const body = await req.json();
    if (!body.name || !body.gateway || !body.token) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    // Se a nova chave for ativa, desativa as outras
    if (body.isActive) {
      await db.update(paymentKeys)
        .set({ isActive: false })
        .where(eq(paymentKeys.tenantId, tenant.id));
    }

    const [newKey] = await db.insert(paymentKeys).values({
      tenantId: tenant.id,
      name: body.name,
      gateway: body.gateway,
      token: body.token,
      isActive: body.isActive || false,
      acceptsPix: body.acceptsPix !== undefined ? body.acceptsPix : true,
      acceptsCreditCard: body.acceptsCreditCard !== undefined ? body.acceptsCreditCard : true,
      acceptsBoleto: body.acceptsBoleto !== undefined ? body.acceptsBoleto : false,
    }).returning();

    return NextResponse.json({ success: true, data: newKey });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
