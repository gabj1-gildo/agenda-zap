import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automations } from '@/db/schema/automations';
import { eq } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { id: clientId } = await params;

    const allAutomations = await db.select().from(automations).where(eq(automations.clientId, clientId));

    if (allAutomations.length > 0 && !canAccessTenant(user, allAutomations[0].tenantId)) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: allAutomations });
  } catch (error) {
    console.error('Error fetching client automations:', error);
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
    const { messageTemplate, dayOfWeek, time, isActive, automationType = 'WEEKLY_CHECKIN' } = body;

    const tenantId = body.tenantId || (user.tenants.length > 0 ? user.tenants[0].id : null);
    
    if (!tenantId) {
      return NextResponse.json({ success: false, message: 'Empresa não identificada' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 403 });
    }

    if (dayOfWeek === undefined || !time || !messageTemplate) {
      return NextResponse.json({ success: false, message: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    // Calcula o próximo dia da semana correspondente no futuro
    const now = new Date();
    const nextRun = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);

    const currentDay = now.getDay();
    let daysUntilNext = dayOfWeek - currentDay;
    
    if (daysUntilNext < 0 || (daysUntilNext === 0 && now.getTime() >= nextRun.getTime())) {
      daysUntilNext += 7;
    }
    
    nextRun.setDate(nextRun.getDate() + daysUntilNext);

    const [existing] = await db.select().from(automations).where(eq(automations.clientId, clientId)).limit(1);

    let result;
    if (existing) {
      [result] = await db.update(automations).set({
        messageTemplate,
        dayOfWeek,
        time,
        isActive,
        nextRunAt: nextRun,
        updatedAt: new Date(),
      }).where(eq(automations.id, existing.id)).returning();
    } else {
      [result] = await db.insert(automations).values({
        clientId,
        tenantId,
        automationType,
        messageTemplate,
        dayOfWeek,
        time,
        nextRunAt: nextRun,
        isActive,
      }).returning();
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving automation:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
