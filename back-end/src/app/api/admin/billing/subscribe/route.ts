import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans, userSubscriptions, tenants, invoices } from '@/db/schema';
import { verifyAuth, canAccessTenant } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { env } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const tenantId = req.headers.get('tenant-id');
    if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });

    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!canAccessTenant(user, tenantId)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { planId, formData: rawFormData } = body;

    if (!planId || !rawFormData) {
      return NextResponse.json({ success: false, error: 'Missing planId or formData' }, { status: 400 });
    }

    // Normalize formData: Payment Brick v2 wraps data inside { formData: {...}, additionalData: {...} }
    // If rawFormData contains a nested formData, extract it; otherwise use as-is
    const formData = rawFormData.formData ? rawFormData.formData : rawFormData;

    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });

    const plan = await db.query.plans.findFirst({ where: eq(plans.id, planId) });
    if (!plan) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });

    const mpToken = env.MP_ACCESS_TOKEN;
    if (!mpToken) {
      return NextResponse.json({ success: false, error: 'Master account not configured' }, { status: 500 });
    }

    const isCreditCard = !!formData.token;

    if (isCreditCard) {
      // ==========================================
      // FLOW 1: CREDIT CARD -> PREAPPROVAL (SUBSCRIPTION)
      // ==========================================

      // Map interval to correct frequency for Mercado Pago
      let frequency = 1;
      const frequency_type = 'months';
      if (plan.interval === 'yearly') { frequency = 12; }
      else if (plan.interval === 'semiannual') { frequency = 6; }
      else if (plan.interval === 'quarterly') { frequency = 3; }

      const response = await fetch(`${env.MERCADOPAGO_API_URL}/preapproval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpToken}`,
        },
        body: JSON.stringify({
          preapproval_plan_id: plan.mpPlanId,
          reason: plan.name,
          external_reference: tenantId,
          payer_email: formData.payer?.email,
          card_token_id: formData.token,
          auto_recurring: {
            frequency,
            frequency_type,
            transaction_amount: Number(plan.price),
            currency_id: "BRL"
          },
          back_url: `${env.FRONTEND_URL}/billing`,
          status: "authorized"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Erro MP Subscription:", data);
        return NextResponse.json({ success: false, error: data.message || 'Erro ao assinar no Mercado Pago' }, { status: 400 });
      }

      await db.update(tenants).set({ activePlan: plan.name, paymentStatus: 'ACTIVE' }).where(eq(tenants.id, tenantId));

      const existingSub = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, user.id)
      });

      let trialEndDate: Date | null = null;
      if (plan.trialDays && plan.trialDays > 0) {
        trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);
      }

      let sub;
      if (existingSub) {
        const [updated] = await db.update(userSubscriptions).set({
          planId,
          status: 'ACTIVE',
          mpSubscriptionId: data.id,
          trialEnd: trialEndDate,
          updatedAt: new Date()
        }).where(eq(userSubscriptions.id, existingSub.id)).returning();
        sub = updated;
      } else {
        const [inserted] = await db.insert(userSubscriptions).values({
          userId: user.id,
          planId,
          status: 'ACTIVE',
          mpSubscriptionId: data.id,
          trialEnd: trialEndDate,
        }).returning();
        sub = inserted;
      }

      return NextResponse.json({ success: true, data: sub });

    } else {
      // ==========================================
      // FLOW 2: PIX / BOLETO -> ONE-TIME PAYMENT + INVOICE
      // ==========================================
      
      const idempotencyKey = uuidv4();

      const response = await fetch(`${env.MERCADOPAGO_API_URL}/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpToken}`,
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          transaction_amount: Number(plan.price),
          description: `Assinatura ${plan.name} - ${plan.interval}`,
          payment_method_id: formData.payment_method_id,
          payer: {
            email: formData.payer?.email,
            identification: formData.payer?.identification,
            first_name: formData.payer?.first_name,
            last_name: formData.payer?.last_name
          },
          external_reference: tenantId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Erro MP Payment (PIX/Boleto):", data);
        return NextResponse.json({ success: false, error: data.message || 'Erro ao gerar cobrança no Mercado Pago' }, { status: 400 });
      }

      const now = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // 3 days to pay

      // Criar a fatura de renovação (SUBSCRIPTION)
      const [invoice] = await db.insert(invoices).values({
        userId: user.id,
        planId: plan.id,
        type: 'SUBSCRIPTION',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        totalAmount: plan.price,
        status: 'PENDING',
        paymentGatewayId: data.id.toString(),
        paymentUrl: data.point_of_interaction?.transaction_data?.ticket_url || null,
        dueDate: dueDate
      }).returning();

      // Também registra ou atualiza a userSubscription como PENDING se não existir, ou mantém se já existir.
      const existingSub = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, user.id)
      });

      if (!existingSub) {
        await db.insert(userSubscriptions).values({
          userId: user.id,
          planId: plan.id,
          status: 'PENDING',
        });
      }

      return NextResponse.json({ success: true, data: { invoice, payment_info: data } });
    }

  } catch (error) {
    console.error("Subscription Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
