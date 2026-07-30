import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, isNotNull, desc } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');

    let targetTenantId = tenantId;
    if (!targetTenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not specified' }, { status: 400 });
    }

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, targetTenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    // Pegar agendamentos que têm paymentId (que passaram por checkout/pix)
    const history = await db.query.appointments.findMany({
      where: eq(appointments.tenantId, targetTenantId),
      with: {
        client: true,
      },
      orderBy: [desc(appointments.createdAt)]
    });

    // Inclui agendamentos manuais (sem paymentId) no histórico financeiro
    const transactions = history.map(h => ({
      id: h.id,
      paymentId: h.paymentId || 'Manual',
      amount: h.price,
      status: h.status === 'PAGO' ? 'Pago' : (h.status === 'CANCELADO' ? 'Cancelado' : 'Pendente'),
      clientName: h.client?.name || 'Desconhecido',
      date: h.createdAt,
      service: h.serviceName
    }));
    
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
