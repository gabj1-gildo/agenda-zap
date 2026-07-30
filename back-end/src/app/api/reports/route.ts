import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { appointments, clients, professionals, rooms, services } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || req.headers.get('x-tenant-id');
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing tenantId' }, { status: 401 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const startDate = startDateStr ? new Date(startDateStr) : new Date(0);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    const result = await withTenant(tenantId, async (tx) => {
      // Fetch appointments within date range
      const data = await tx.select({
        id: appointments.id,
        date: appointments.date,
        serviceName: appointments.serviceName,
        price: appointments.price,
        status: appointments.status,
        clientName: clients.name,
        clientPhone: clients.phone,
        professionalName: professionals.name,
        roomName: rooms.name
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
      .leftJoin(rooms, eq(appointments.roomId, rooms.id))
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.date, startDate),
          lte(appointments.date, endDate)
        )
      )
      .orderBy(desc(appointments.date));

      return data;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
