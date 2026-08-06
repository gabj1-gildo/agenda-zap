import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { tenantPhones, userSubscriptions } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    let phones: any[] = [];
    await withTenant(tenantId, async (tx) => {
      phones = await tx.query.tenantPhones.findMany({
        where: eq(tenantPhones.tenantId, tenantId),
        orderBy: [desc(tenantPhones.createdAt)]
      });
    });

    return NextResponse.json({ success: true, data: phones });
  } catch (error: any) {
    console.error('Error fetching tenant phones:', error);
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

    // Validar limites
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, user.id),
      with: { plan: true }
    });

    if (!subscription || !subscription.plan) {
      return NextResponse.json({ success: false, error: 'Assinatura não encontrada' }, { status: 403 });
    }

    const currentPhones = await db.query.tenantPhones.findMany({
      where: eq(tenantPhones.tenantId, tenantId)
    });

    if (currentPhones.length >= subscription.plan.maxWhatsAppInstances) {
      return NextResponse.json({ success: false, error: `Seu plano (${subscription.plan.name}) permite no máximo ${subscription.plan.maxWhatsAppInstances} instância(s) de WhatsApp. Faça upgrade para adicionar mais.` }, { status: 403 });
    }

    const body = await req.json();
    if (!body.phone || !body.evolutionInstanceName) {
      return NextResponse.json({ success: false, error: 'Telefone e nome da instância são obrigatórios' }, { status: 400 });
    }

    let newPhone: any = null;
    await withTenant(tenantId, async (tx) => {
      const inserted = await tx.insert(tenantPhones).values({
        tenantId,
        phone: body.phone,
        evolutionInstanceName: body.evolutionInstanceName,
        evolutionInstanceStatus: 'DISCONNECTED',
      }).returning();
      newPhone = inserted[0];
    });

    return NextResponse.json({ success: true, data: newPhone });
  } catch (error: any) {
    console.error('Error creating tenant phone:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
