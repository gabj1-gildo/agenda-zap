import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, tokenLogs, billing, appointments } from '@/db/schema';
import { eq, sum, count } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    // 1. Total Tenants
    const tenantsList = await db.select().from(tenants);
    const totalTenants = tenantsList.length;

    // 2. Active Billing (MRR calculation)
    // Assume each active billing plan is R$ 97
    const activeBilling = await db.query.billing.findMany({
      where: eq(billing.status, 'ACTIVE')
    });
    const mrr = activeBilling.length * 97;

    // 3. Total Tokens Used
    const tokensResult = await db.select({ total: sum(tokenLogs.tokensUsed) }).from(tokenLogs);
    const totalTokens = Number(tokensResult[0]?.total || 0);

    // 4. Total Pix Volume (Paid Appointments)
    const paidAppointments = await db.query.appointments.findMany({
      where: eq(appointments.status, 'PAGO')
    });
    const pixVolume = paidAppointments.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

    // Also let's prepare some mock data for the tokens chart (last 7 days or simply by tenant)
    // For MVP, we will send raw token logs and let frontend aggregate it, or aggregate by tenant
    const allTokens = await db.query.tokenLogs.findMany({
      with: {
        tenant: true
      },
      limit: 100
    });

    const tokensByTenant = allTokens.reduce((acc: any, log) => {
      const name = log.tenant?.name || 'Desconhecido';
      acc[name] = (acc[name] || 0) + log.tokensUsed;
      return acc;
    }, {});
    
    const chartData = Object.keys(tokensByTenant).map(name => ({
      name,
      tokens: tokensByTenant[name]
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalTenants,
        activeSubscriptions: activeBilling.length,
        mrr,
        totalTokens,
        pixVolume,
        chartData,
        tenantsList
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
