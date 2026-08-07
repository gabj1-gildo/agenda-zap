import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clientSubscriptions, tenantPlans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '@/config/env';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    const { id } = await params;
    const clientId = id;

    // Buscar assinaturas do cliente com detalhes do plano
    const subscriptions = await db.query.clientSubscriptions.findMany({
      where: eq(clientSubscriptions.clientId, clientId),
      with: {
        tenantPlan: true
      },
      orderBy: (subs, { desc }) => [desc(subs.createdAt)]
    });

    return NextResponse.json({ success: true, data: subscriptions });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    const { id } = await params;
    const clientId = id;
    const body = await req.json();

    if (!body.planId) {
      return NextResponse.json({ success: false, error: 'planId is required' }, { status: 400 });
    }

    const [newSubscription] = await db.insert(clientSubscriptions).values({
      clientId: clientId,
      tenantPlanId: body.planId,
      status: 'ACTIVE',
      startDate: new Date(),
    }).returning();

    return NextResponse.json({ success: true, data: newSubscription });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ success: false, error: 'Failed to create subscription' }, { status: 500 });
  }
}
