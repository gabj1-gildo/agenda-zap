import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { tenantPlans } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let plans: any[] = [];
    await withTenant(tenantId, async (tx) => {
      plans = await tx.query.tenantPlans.findMany({
        where: eq(tenantPlans.tenantId, tenantId),
        orderBy: [desc(tenantPlans.createdAt)]
      });
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('Error fetching tenant plans:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    if (!body.name || !body.price) {
      return NextResponse.json({ success: false, error: 'Nome e Preço são obrigatórios' }, { status: 400 });
    }

    let newPlan: any = null;
    await withTenant(tenantId, async (tx) => {
      const inserted = await tx.insert(tenantPlans).values({
        tenantId,
        name: body.name,
        description: body.description || null,
        type: body.type || 'RECURRING',
        durationDays: body.durationDays ? parseInt(body.durationDays, 10) : null,
        price: body.price.toString()
      }).returning();
      newPlan = inserted[0];
    });

    return NextResponse.json({ success: true, data: newPlan });
  } catch (error: any) {
    console.error('Error creating tenant plan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
