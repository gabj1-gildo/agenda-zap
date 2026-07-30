import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, clients, tenants } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

// GET — agendamentos de um período (mês, semana ou dia)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, id)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);

    const startDateParam = searchParams.get('start');
    const endDateParam = searchParams.get('end');

    let start = new Date();
    start.setHours(0, 0, 0, 0);
    let end = new Date(start);
    end.setDate(end.getDate() + 7); // Default fallback: 7 days

    if (startDateParam && endDateParam) {
      start = new Date(startDateParam);
      end = new Date(endDateParam);
    } else if (searchParams.get('weekStart')) {
      start = new Date(searchParams.get('weekStart') as string);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    }

    const t = await db.select({ schedulingMode: tenants.schedulingMode }).from(tenants).where(eq(tenants.id, id));
    const schedulingMode = t.length > 0 ? t[0].schedulingMode : 'GERAL';

    const rows = await db
      .select({
        id: appointments.id,
        date: appointments.date,
        status: appointments.status,
        serviceName: appointments.serviceName,
        price: appointments.price,
        clientName: clients.name,
        clientPhone: clients.phone,
        professionalId: appointments.professionalId,
        roomId: appointments.roomId
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .where(
        and(
          eq(appointments.tenantId, id),
          gte(appointments.date, start),
          lte(appointments.date, end)
        )
      );

    return NextResponse.json({ success: true, data: rows, schedulingMode });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro ao buscar agenda' }, { status: 500 });
  }
}
