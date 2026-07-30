import { NextResponse } from 'next/server';
import { db } from '@/db';
import { withTenant } from '@/db/withTenant';
import { clients, appointments, chatSessions } from '@/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { tokenLogs } from '@/db/schema';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') || req.headers.get('tenant-id');
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID is required' }, { status: 400 });
    }

    if (!canAccessTenant(user, tenantId)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access to this tenant is denied' }, { status: 403 });
    }

    const startDate = startDateParam ? new Date(startDateParam) : new Date(0); // default to all time
    const endDate = endDateParam ? new Date(endDateParam) : new Date(); // default to now
    
    // Assegurar que o endDate cubra o final do dia
    endDate.setHours(23, 59, 59, 999);

    const result = await withTenant(tenantId, async (tx) => {
      // 1. Appointments no período
      const apps = await tx.select().from(appointments).where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.date, startDate),
          lte(appointments.date, endDate)
        )
      );

      let faturamento = 0;
      let atendimentosPagos = 0;
      let atendimentosPendentes = 0;
      let atendimentosCancelados = 0;
      let appointmentsCount = apps.length;

      // Para o gráfico: agrupar por data (YYYY-MM-DD)
      const chartMap = new Map<string, { faturamento: number, atendimentos: number }>();

      apps.forEach(app => {
        const d = new Date(app.date);
        const dateKey = d.toISOString().split('T')[0];
        
        if (!chartMap.has(dateKey)) {
          chartMap.set(dateKey, { faturamento: 0, atendimentos: 0 });
        }
        const daily = chartMap.get(dateKey)!;
        daily.atendimentos += 1;

        if (app.status === 'PAGO') {
          atendimentosPagos += 1;
          const val = parseFloat(app.price as any) || 0;
          faturamento += val;
          daily.faturamento += val;
        } else if (app.status === 'CANCELADO') {
          atendimentosCancelados += 1;
        } else {
          atendimentosPendentes += 1;
        }
      });

      const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({
        name: date.split('-').reverse().slice(0, 2).join('/'), // DD/MM
        faturamento: data.faturamento,
        atendimentos: data.atendimentos,
        dateKey: date // para sort
      })).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

      // 2. Novos clientes no período
      const [newClients] = await tx.select({ count: sql`count(*)` }).from(clients).where(
        and(
          eq(clients.tenantId, tenantId),
          gte(clients.createdAt, startDate),
          lte(clients.createdAt, endDate)
        )
      );

      // 3. Tokens gastos no período
      const [tokensQuery] = await tx.select({ total: sql`sum(${tokenLogs.tokensUsed})` }).from(tokenLogs).where(
        and(
          eq(tokenLogs.tenantId, tenantId),
          gte(tokenLogs.timestamp, startDate),
          lte(tokenLogs.timestamp, endDate)
        )
      );

      // 4. Kanban Clients: todos os clientes deste tenant (sem filtro de data para não quebrar o funil atual)
      const kanban = await tx.query.clients.findMany({
        where: eq(clients.tenantId, tenantId),
        orderBy: (clients, { desc }) => [desc(clients.updatedAt)]
      });

      // 5. Active chats in the period
      const [activeChats] = await tx.select({ count: sql`count(*)` }).from(chatSessions).where(
        and(
          eq(chatSessions.tenantId, tenantId),
          gte(chatSessions.updatedAt, startDate),
          lte(chatSessions.updatedAt, endDate)
        )
      );

      const ticketMedio = atendimentosPagos > 0 ? faturamento / atendimentosPagos : 0;
      const conversasAtivas = Number(activeChats.count || 0);
      const taxaConversao = conversasAtivas > 0 ? (appointmentsCount / conversasAtivas) * 100 : 0;

      const responseData: any = { 
        faturamento, 
        appointmentsCount,
        atendimentosPagos,
        atendimentosPendentes,
        atendimentosCancelados,
        novosClientes: Number(newClients.count || 0),
        tokensUsados: Number(tokensQuery.total || 0),
        ticketMedio,
        taxaConversao,
        conversasAtivas,
        chartData,
        kanban 
      };

      if (user.role === 'ATTENDANT') {
        delete responseData.faturamento;
        responseData.chartData.forEach((d: any) => delete d.faturamento);
      }

      return responseData;
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
