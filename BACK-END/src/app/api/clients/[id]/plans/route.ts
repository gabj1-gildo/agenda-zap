import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clientPlans } from '@/db/schema/clientPlans';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { id: clientId } = await params;

    const [plan] = await db.select().from(clientPlans).where(eq(clientPlans.clientId, clientId)).limit(1);

    if (plan && !canAccessTenant(user, plan.tenantId)) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: plan || null });
  } catch (error) {
    console.error('Error fetching client plan:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { id: clientId } = await params;
    const body = await req.json();
    const { durationMonths } = body;

    if (!durationMonths || typeof durationMonths !== 'number') {
      return NextResponse.json({ success: false, message: 'Duração em meses é obrigatória' }, { status: 400 });
    }

    // O tenant ID será o primeiro da lista do usuário se ele não for admin
    // Se ele for admin, precisariamos enviar o tenantId no body. Para simplificar, usamos o primeiro tenant do usuário ou o que vier no body.
    const tenantId = body.tenantId || (user.tenants.length > 0 ? user.tenants[0].id : null);
    
    if (!tenantId) {
      return NextResponse.json({ success: false, message: 'Empresa não identificada' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 403 });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Upsert (Insere ou atualiza o plano existente)
    const [existingPlan] = await db.select().from(clientPlans).where(eq(clientPlans.clientId, clientId)).limit(1);

    let result;
    if (existingPlan) {
      // Atualiza estendendo a data ou substituindo
      // Aqui vamos apenas substituir com o novo prazo a partir de agora.
      [result] = await db.update(clientPlans).set({
        durationMonths,
        startDate,
        endDate,
        status: 'ACTIVE',
        updatedAt: new Date(),
      }).where(eq(clientPlans.id, existingPlan.id)).returning();
    } else {
      [result] = await db.insert(clientPlans).values({
        clientId,
        tenantId,
        durationMonths,
        startDate,
        endDate,
        status: 'ACTIVE',
      }).returning();
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving client plan:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
