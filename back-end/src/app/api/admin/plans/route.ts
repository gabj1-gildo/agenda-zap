import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { verifyAuth } from '@/lib/auth';
import { env } from '@/config/env';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allPlans = await db.query.plans.findMany({
      orderBy: (plans, { asc }) => [asc(plans.price)]
    });

    return NextResponse.json({ success: true, data: allPlans });
  } catch (error) {
    console.error("Erro ao listar planos:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, prices, maxTenants, maxUsers, maxWhatsAppInstances, maxAppointmentsPerMonth, includedChats, extraChatPrice, features, trialDays } = body;

    if (!name || !prices || Object.keys(prices).length === 0) {
      return NextResponse.json({ success: false, error: 'Missing name or prices' }, { status: 400 });
    }

    const mpToken = env.MP_ACCESS_TOKEN;
    const insertedPlans = [];

    for (const [interval, price] of Object.entries(prices)) {
      let mpPlanId = null;
      const numPrice = Number(price);

      if (mpToken && numPrice > 0) {
        let frequency = 1;
        let frequency_type = 'months';

        if (interval === 'yearly') { frequency = 12; }
        else if (interval === 'semiannual') { frequency = 6; }
        else if (interval === 'quarterly') { frequency = 3; }

        const autoRecurring: any = {
          frequency: frequency,
          frequency_type: frequency_type,
          transaction_amount: numPrice,
          currency_id: "BRL"
        };

        if (trialDays && trialDays > 0) {
          autoRecurring.free_trial = {
            frequency: trialDays,
            frequency_type: 'days'
          };
        }

        const response = await fetch(`${env.MERCADOPAGO_API_URL}/preapproval_plan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mpToken}`,
          },
          body: JSON.stringify({
            reason: name,
            auto_recurring: autoRecurring,
            back_url: `${env.FRONTEND_URL}/billing`
          })
        });

        const data = await response.json();
        if (response.ok) {
          mpPlanId = data.id;
        } else {
          console.error("Erro ao criar plano no MP:", data);
        }
      }

      const [newPlan] = await db.insert(plans).values({
        name,
        description,
        price: numPrice.toString(),
        interval,
        maxTenants: maxTenants || 1,
        maxUsers: maxUsers || 1,
        maxWhatsAppInstances: maxWhatsAppInstances || 1,
        maxAppointmentsPerMonth: maxAppointmentsPerMonth || 100,
        includedChats: includedChats || 150,
        extraChatPrice: extraChatPrice || '0.15',
        trialDays: trialDays || 0,
        features: features || [],
        mpPlanId
      }).returning();
      
      insertedPlans.push(newPlan);
    }

    return NextResponse.json({ success: true, data: insertedPlans });
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id: originalName, name, description, prices, maxTenants, maxUsers, maxWhatsAppInstances, maxAppointmentsPerMonth, includedChats, extraChatPrice, features, trialDays } = body;

    if (!originalName || !name || !prices || Object.keys(prices).length === 0) {
      return NextResponse.json({ success: false, error: 'Missing originalName, name or prices' }, { status: 400 });
    }

    const existingPlans = await db.query.plans.findMany({
      where: eq(plans.name, originalName)
    });

    const mpToken = env.MP_ACCESS_TOKEN;
    const updatedPlans = [];
    const processedIntervals = new Set();

    for (const [interval, price] of Object.entries(prices)) {
      processedIntervals.add(interval);
      const numPrice = Number(price);
      const existing = existingPlans.find(p => p.interval === interval);

      if (existing) {
        let frequency = 1;
        const frequency_type = 'months';
        if (interval === 'yearly') { frequency = 12; }
        else if (interval === 'semiannual') { frequency = 6; }
        else if (interval === 'quarterly') { frequency = 3; }

        let mpPlanId = existing.mpPlanId;

        // Sync with Mercado Pago
        if (mpToken && numPrice > 0) {
          const autoRecurring: any = {
            frequency, frequency_type,
            transaction_amount: numPrice,
            currency_id: "BRL"
          };

          if (trialDays && trialDays > 0) {
            autoRecurring.free_trial = { frequency: trialDays, frequency_type: 'days' };
          }

          if (existing.mpPlanId) {
            // UPDATE existing MP plan
            const response = await fetch(`${env.MERCADOPAGO_API_URL}/preapproval_plan/${existing.mpPlanId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mpToken}` },
              body: JSON.stringify({
                reason: name,
                auto_recurring: autoRecurring,
                back_url: `${env.FRONTEND_URL}/billing`
              })
            });

            const data = await response.json();
            if (!response.ok) {
              console.error(`Erro ao atualizar plano MP ${existing.mpPlanId}:`, data);
            }
          } else {
            // CREATE new MP plan if it didn't have one
            const response = await fetch(`${env.MERCADOPAGO_API_URL}/preapproval_plan`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mpToken}` },
              body: JSON.stringify({
                reason: name,
                auto_recurring: autoRecurring,
                back_url: `${env.FRONTEND_URL}/billing`
              })
            });

            const data = await response.json();
            if (response.ok) {
              mpPlanId = data.id;
            } else {
              console.error("Erro ao criar plano MP:", data);
            }
          }
        }

        const [updatedPlan] = await db.update(plans)
          .set({
            name,
            description,
            price: numPrice.toString(),
            maxTenants: maxTenants || 1,
            maxUsers: maxUsers || 1,
            maxWhatsAppInstances: maxWhatsAppInstances || 1,
            maxAppointmentsPerMonth: maxAppointmentsPerMonth || 100,
            includedChats: includedChats || 150,
            extraChatPrice: extraChatPrice || '0.15',
            trialDays: trialDays || 0,
            features: features || [],
            mpPlanId,
          })
          .where(eq(plans.id, existing.id))
          .returning();
        updatedPlans.push(updatedPlan);
      } else {
        let mpPlanId = null;
        if (mpToken && numPrice > 0) {
          let frequency = 1;
          let frequency_type = 'months';
  
          if (interval === 'yearly') { frequency = 12; }
          else if (interval === 'semiannual') { frequency = 6; }
          else if (interval === 'quarterly') { frequency = 3; }
  
          const autoRecurring: any = {
            frequency, frequency_type,
            transaction_amount: numPrice,
            currency_id: "BRL"
          };
  
          if (trialDays && trialDays > 0) {
            autoRecurring.free_trial = { frequency: trialDays, frequency_type: 'days' };
          }
  
          const response = await fetch(`${env.MERCADOPAGO_API_URL}/preapproval_plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mpToken}` },
            body: JSON.stringify({ reason: name, auto_recurring: autoRecurring, back_url: `${env.FRONTEND_URL}/billing` })
          });
  
          const data = await response.json();
          if (response.ok) mpPlanId = data.id;
        }

        const [newPlan] = await db.insert(plans).values({
          name, description, price: numPrice.toString(), interval,
          maxTenants: maxTenants || 1, maxUsers: maxUsers || 1, maxWhatsAppInstances: maxWhatsAppInstances || 1,
          maxAppointmentsPerMonth: maxAppointmentsPerMonth || 100,
          includedChats: includedChats || 150, extraChatPrice: extraChatPrice || '0.15',
          trialDays: trialDays || 0, features: features || [], mpPlanId
        }).returning();
        updatedPlans.push(newPlan);
      }
    }

    for (const existing of existingPlans) {
      if (!processedIntervals.has(existing.interval)) {
        await db.delete(plans).where(eq(plans.id, existing.id));
      }
    }

    return NextResponse.json({ success: true, data: updatedPlans });
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
