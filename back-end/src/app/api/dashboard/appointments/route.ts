import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { appointments } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    let tenantId = url.searchParams.get('tenantId') || req.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access to this tenant is denied' }, { status: 403 });
    }

    // Execute within tenant context
    const result = await withTenant(tenantId, async (tx) => {
      const allAppointments = await tx.query.appointments.findMany({
        where: eq(appointments.tenantId, tenantId),
        orderBy: [desc(appointments.date)],
        with: {
          client: true
        }
      });

      const { paymentKeys } = await import('@/db/schema');
      const activeKey = await tx.query.paymentKeys.findFirst({
        where: and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.isActive, true))
      });
      
      return { allAppointments, activeKey };
    });

    const { allAppointments, activeKey } = result;
    
    let totalMinutes = 30;
    if (activeKey?.pixExpirationTime) {
      const [hours, minutes] = activeKey.pixExpirationTime.split(':').map(Number);
      totalMinutes = (hours * 60) + minutes;
    }

    const mappedAppointments = allAppointments.map(apt => {
      if (apt.status === 'PENDENTE' && apt.createdAt) {
        return {
          ...apt,
          expiresAt: new Date(new Date(apt.createdAt).getTime() + totalMinutes * 60000).toISOString()
        };
      }
      return apt;
    });

    return NextResponse.json({ success: true, data: mappedAppointments });
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json({ success: false, error: 'Missing appointmentId or status' }, { status: 400 });
    }

    const tenantId = req.headers.get('x-tenant-id') || body.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updated = await withTenant(tenantId, async (tx) => {
      const existing = await tx.query.appointments.findFirst({
        where: and(eq(appointments.id, appointmentId), eq(appointments.tenantId, tenantId))
      });
      
      if (!existing) {
        throw new Error('Appointment not found');
      }

      const result = await tx.update(appointments)
        .set({ status })
        .where(and(eq(appointments.id, appointmentId), eq(appointments.tenantId, tenantId)))
        .returning();
        
      if (existing.status !== status) {
        const { appointmentLogs } = await import('@/db/schema');
        await tx.insert(appointmentLogs).values({
          tenantId,
          appointmentId,
          userId: user.id,
          actionByName: user.name || user.email || 'Usuário Desconhecido',
          action: 'UPDATE_STATUS',
          details: { oldStatus: existing.status, newStatus: status }
        });
      }
      
      return result;
    });

    if (updated.length > 0 && (status === 'PAGO' || status === 'CONFIRMADO')) {
      const { syncAppointmentToCalendar } = await import('@/services/googleCalendar');
      await syncAppointmentToCalendar(appointmentId).catch(e => console.error('Erro calendar', e));
    }

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tenantId, clientName, clientPhone, date, serviceName, price } = body;

    if (!tenantId || !clientName || !clientPhone || !date || !serviceName || price === undefined) {
      return NextResponse.json({ success: false, error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const newAppointment = await withTenant(tenantId, async (tx) => {
      // 1. Find or create client
      const { clients } = await import('@/db/schema');
      let client = await tx.query.clients.findFirst({
        where: and(eq(clients.phone, clientPhone), eq(clients.tenantId, tenantId))
      });

      if (!client) {
        const inserted = await tx.insert(clients).values({
          tenantId,
          phone: clientPhone,
          name: clientName,
          whatsappName: clientName,
        }).returning();
        client = inserted[0];
      } else {
        if (!client.name || client.name === '') {
          await tx.update(clients).set({ name: clientName }).where(eq(clients.id, client.id));
        }
      }

      // 2. Insert appointment
      const result = await tx.insert(appointments).values({
        tenantId,
        clientId: client.id,
        date: new Date(date),
        serviceName,
        price: price.toString(),
        status: 'PENDENTE'
      }).returning();
      
      const { appointmentLogs } = await import('@/db/schema');
      await tx.insert(appointmentLogs).values({
        tenantId,
        appointmentId: result[0].id,
        userId: user.id,
        actionByName: user.name || user.email || 'Usuário Desconhecido',
        action: 'CREATE',
        details: { status: 'PENDENTE', date: new Date(date).toISOString() }
      });
      
      return result;
    });

    return NextResponse.json({ success: true, data: newAppointment[0] });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
