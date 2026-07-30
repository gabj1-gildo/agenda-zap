import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, userSubscriptions, tenants, plans, userTenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/config/env';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    
    // Support both v1 (query params) and v2 (body) webhook formats
    let topic = url.searchParams.get('topic') || url.searchParams.get('type');
    let id = url.searchParams.get('id') || url.searchParams.get('data.id');

    // V2 format: data comes in request body as { type, data: { id } }
    let body: any = null;
    try {
      body = await req.json();
      if (!topic && body?.type) topic = body.type;
      if (!id && body?.data?.id) id = String(body.data.id);
    } catch {
      // Body may not be JSON in v1 format, ignore
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
    }

    // Apenas nos importamos com atualizações de pagamento
    if (topic !== 'payment' && topic !== 'payment.created' && topic !== 'payment.updated') {
      return NextResponse.json({ success: true, message: 'Ignored topic' });
    }

    const mpToken = env.MP_ACCESS_TOKEN;
    if (!mpToken) {
      return NextResponse.json({ success: false, error: 'Master account not configured' }, { status: 500 });
    }

    // Buscar os dados do pagamento no Mercado Pago
    const response = await fetch(`${env.MERCADOPAGO_API_URL}/v1/payments/${id}`, {
      headers: {
        "Authorization": `Bearer ${mpToken}`,
      }
    });

    if (!response.ok) {
      console.error(`Erro ao buscar pagamento ${id} no Mercado Pago`);
      return NextResponse.json({ success: false, error: 'Failed to fetch payment' }, { status: 400 });
    }

    const payment = await response.json();

    if (payment.status === 'approved') {
      // Buscar a fatura no banco pelo ID do pagamento
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.paymentGatewayId, id.toString())
      });

      if (invoice && invoice.status !== 'PAID') {
        // Marcar fatura como paga
        await db.update(invoices).set({
          status: 'PAID',
          paidAt: new Date()
        }).where(eq(invoices.id, invoice.id));

        if (invoice.type === 'SUBSCRIPTION' && invoice.planId) {
          // Ativar a assinatura
          const existingSub = await db.query.userSubscriptions.findFirst({
            where: eq(userSubscriptions.userId, invoice.userId)
          });

          const plan = await db.query.plans.findFirst({
            where: eq(plans.id, invoice.planId)
          });

          if (existingSub && plan) {
            let trialEndDate: Date | null = null;
            if (plan.trialDays && plan.trialDays > 0) {
              trialEndDate = new Date();
              trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);
            }

            // Extensão do plano (CurrentPeriodEnd não foi adicionado em schema antes, então usamos status ACTIVE e trialEnd se houver.
            // Para planos sem renovação automática (PIX/Boleto), seria ideal ter um 'currentPeriodEnd' no schema, mas manteremos ACTIVE
            // e confiaremos no CRON para gerar nova fatura 10 dias antes de 'createdAt + X meses' ou se tivermos currentPeriodEnd.
            
            await db.update(userSubscriptions).set({
              status: 'ACTIVE',
              planId: invoice.planId,
              trialEnd: trialEndDate,
              updatedAt: new Date()
            }).where(eq(userSubscriptions.id, existingSub.id));
            
            // Opcionalmente atualiza o tenant
            const userTenant = await db.query.userTenants.findFirst({
              where: eq(userTenants.userId, invoice.userId)
            });
            if (userTenant) {
              await db.update(tenants).set({ paymentStatus: 'ACTIVE', activePlan: plan.name }).where(eq(tenants.id, userTenant.tenantId));
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
