import { NextResponse } from 'next/server';
import { db } from '@/db';
import { plans, userSubscriptions, invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { updateAsaasSaasSubscription, createAsaasSaasCharge } from '@/services/payments/asaas/saas';

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { planId, isInstant } = await req.json();

    if (!planId) {
      return NextResponse.json({ success: false, message: 'Plano não fornecido' }, { status: 400 });
    }

    const newPlan = await db.query.plans.findFirst({ where: eq(plans.id, planId) });
    if (!newPlan) {
      return NextResponse.json({ success: false, message: 'Plano não encontrado' }, { status: 404 });
    }

    const currentSub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, user.id),
      with: {
        plan: true
      }
    });

    if (!currentSub || !currentSub.plan) {
      return NextResponse.json({ success: false, message: 'Nenhuma assinatura ativa encontrada' }, { status: 404 });
    }

    if (currentSub.planId === planId) {
      return NextResponse.json({ success: false, message: 'Você já está neste plano' }, { status: 400 });
    }

    const newAmount = Number(newPlan.price);
    const oldAmount = Number(currentSub.plan.price);
    const isUpgrade = newAmount > oldAmount;

    // Atualiza o Asaas para que a PRÓXIMA fatura já venha com o valor correto
    if (currentSub.asaasSubscriptionId) {
      await updateAsaasSaasSubscription(
        currentSub.asaasSubscriptionId, 
        newAmount, 
        `Plano ${newPlan.name} - Agenda Zap`
      );
    }

    if (isUpgrade && isInstant) {
      const difference = newAmount - oldAmount;
      
      // Cobra a diferença imediatamente se houver um asaasCustomerId e a diferença for positiva
      if (difference > 0 && currentSub.asaasCustomerId) {
        const externalReference = JSON.stringify({
          userId: user.id,
          upgradeTo: planId,
          type: 'UPGRADE_FEE'
        });
        
        await createAsaasSaasCharge(
          currentSub.asaasCustomerId,
          difference,
          externalReference,
          `Upgrade para Plano ${newPlan.name} (Diferença)`,
          1
        );
      }

      // No modo instantâneo, atualiza o planId imediatamente (limites já sobem)
      await db.update(userSubscriptions)
        .set({ 
          planId: newPlan.id,
          nextPlanId: null,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, currentSub.id));

      return NextResponse.json({ 
        success: true, 
        message: 'Upgrade realizado com sucesso. Seus novos limites já estão disponíveis! Uma fatura de diferença foi gerada.'
      });
      
    } else {
      // Downgrade ou Upgrade Programado
      // Mantém o planId atual e salva o nextPlanId para a virada do ciclo
      await db.update(userSubscriptions)
        .set({ 
          nextPlanId: newPlan.id,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, currentSub.id));

      const message = isUpgrade 
        ? 'Upgrade programado com sucesso. Os novos limites entrarão em vigor no próximo ciclo de faturamento.'
        : 'Downgrade programado com sucesso. Os limites do plano atual continuam válidos até o final do ciclo já pago.';

      return NextResponse.json({ success: true, message });
    }

  } catch (error: any) {
    console.error('[SUBSCRIPTION CHANGE ERROR]', error);
    return NextResponse.json({ success: false, message: error.message || 'Erro ao alterar o plano' }, { status: 500 });
  }
}
