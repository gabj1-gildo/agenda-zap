import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userSubscriptions, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === 'subscription_preapproval') {
      const mpSubscriptionId = body.data.id;
      // Fetch latest info from MP to update status
      const { env } = await import('@/config/env');
      if (env.MP_ACCESS_TOKEN) {
        const response = await fetch(`${env.MERCADOPAGO_API_URL}/preapproval/${mpSubscriptionId}`, {
          headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` }
        });
        const subData = await response.json();
        
        if (response.ok && subData.status) {
          // Status in MP: 'authorized', 'paused', 'cancelled'
          let newStatus = 'ACTIVE';
          if (subData.status === 'cancelled') newStatus = 'CANCELED';
          if (subData.status === 'paused') newStatus = 'PAST_DUE';

          const [updated] = await db.update(userSubscriptions)
            .set({ status: newStatus, updatedAt: new Date() })
            .where(eq(userSubscriptions.mpSubscriptionId, mpSubscriptionId))
            .returning();
          
          if (updated) {
            // Se precisar atualizar algo no user, faça aqui.
            console.log(`Subscription ${updated.id} status updated to ${newStatus}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook MP Subscription error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
