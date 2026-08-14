import { NextResponse } from 'next/server';
import { db } from '@/db';
import { automations, clients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await db
      .select({
        id: automations.id,
        name: automations.name,
        targetType: automations.targetType,
        targetValue: automations.targetValue,
        clientId: automations.clientId,
        automationType: automations.automationType,
        messageTemplate: automations.messageTemplate,
        dayOfWeek: automations.dayOfWeek,
        time: automations.time,
        nextRunAt: automations.nextRunAt,
        isActive: automations.isActive,
        createdAt: automations.createdAt,
        clientName: clients.name,
        clientPhone: clients.phone,
      })
      .from(automations)
      .leftJoin(clients, eq(automations.clientId, clients.id))
      .where(eq(automations.tenantId, tenantId))
      .orderBy(desc(automations.createdAt));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, targetType, targetValue, clientId, messageTemplate, dayOfWeek, time } = body;

    if (!messageTemplate || typeof dayOfWeek !== 'number' || !time) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    if (targetType === 'CLIENT' && !clientId) {
      return NextResponse.json({ success: false, error: 'Client ID is required for target type CLIENT' }, { status: 400 });
    }

    // Calculate next run
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    let nextRunAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    // Find the next occurrence of dayOfWeek
    const currentDay = nextRunAt.getDay();
    let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    
    // If it's today but the time has passed, add 7 days
    if (daysToAdd === 0 && nextRunAt <= now) {
      daysToAdd = 7;
    }
    
    nextRunAt.setDate(nextRunAt.getDate() + daysToAdd);

    const [newAutomation] = await db.insert(automations).values({
      name: name || 'Automação',
      targetType: targetType || 'CLIENT',
      targetValue: targetValue || null,
      clientId: clientId || null,
      tenantId,
      automationType: 'CUSTOM_RECURRING',
      messageTemplate,
      dayOfWeek,
      time,
      nextRunAt,
      isActive: true,
    }).returning();

    return NextResponse.json({ success: true, data: newAutomation });
  } catch (error: any) {
    console.error('Error creating automation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
