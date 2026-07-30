import { db } from '@/db';
import { userSubscriptions, invoices, chatSessions, userTenants, metaMessageLogs } from '@/db/schema';
import { eq, and, lte, inArray, count, gte } from 'drizzle-orm';

export async function processBillingRenewals(forceDate?: Date) {
  const now = forceDate || new Date();
  
  // Encontrar assinaturas ativas cujo período atual acabou ou expira hoje
  const expiringSubs = await db.query.userSubscriptions.findMany({
    where: and(
      eq(userSubscriptions.status, 'ACTIVE'),
      lte(userSubscriptions.currentPeriodEnd, now)
    ),
    with: {
      plan: true
    }
  });

  let processed = 0;

  for (const sub of expiringSubs) {
    if (!sub.plan) continue;

    await db.transaction(async (tx) => {
      // Calcular o início do ciclo atual
      // Como currentPeriodEnd acabou de vencer, o início foi 1 ciclo atrás
      const cycleStart = new Date(sub.currentPeriodEnd!);
      if (sub.plan!.interval === 'monthly') {
        cycleStart.setMonth(cycleStart.getMonth() - 1);
      } else if (sub.plan!.interval === 'semiannual') {
        cycleStart.setMonth(cycleStart.getMonth() - 6);
      } else if (sub.plan!.interval === 'yearly') {
        cycleStart.setFullYear(cycleStart.getFullYear() - 1);
      } else {
        cycleStart.setMonth(cycleStart.getMonth() - 1); // Fallback
      }

      // Encontrar todos os tenants deste usuário
      const tenantsOfUser = await tx.select().from(userTenants).where(eq(userTenants.userId, sub.userId));
      const tenantIds = tenantsOfUser.map(t => t.tenantId);

      let totalChats = 0;
      let totalMetaMessages = 0;
      if (tenantIds.length > 0) {
        // Contar chat_sessions no ciclo (usando createdAt)
        const chatCount = await tx.select({ value: count() })
          .from(chatSessions)
          .where(and(
            inArray(chatSessions.tenantId, tenantIds),
            gte(chatSessions.createdAt, cycleStart),
            lte(chatSessions.createdAt, sub.currentPeriodEnd!)
          ));
        
        totalChats = chatCount[0]?.value || 0;

        // Contar mensagens Meta Cloud
        const metaCount = await tx.select({ value: count() })
          .from(metaMessageLogs)
          .where(and(
            inArray(metaMessageLogs.tenantId, tenantIds),
            gte(metaMessageLogs.createdAt, cycleStart),
            lte(metaMessageLogs.createdAt, sub.currentPeriodEnd!)
          ));
        
        totalMetaMessages = metaCount[0]?.value || 0;
      }

      let allowedChats = sub.plan!.includedChats;
      // Premium plan (300 per company)
      if (sub.plan!.maxTenants > 1) {
        allowedChats = sub.plan!.includedChats * tenantIds.length;
      }

      const extraChats = Math.max(0, totalChats - allowedChats);
      const extraChatCost = extraChats * Number(sub.plan!.extraChatPrice);
      
      const META_MESSAGE_PRICE = 0.20; // Repasse definido no Item 19f
      const metaMessageCost = totalMetaMessages * META_MESSAGE_PRICE;

      const totalExtraCost = extraChatCost + metaMessageCost;

      if (totalExtraCost > 0) {
        // Gerar invoice
        await tx.insert(invoices).values({
          userId: sub.userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          extraChats,
          metaMessagesCount: totalMetaMessages,
          totalAmount: totalExtraCost.toString(),
          status: 'PENDING',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 dias para pagar
        });
        
        // TODO: Enviar email ou notificar via webhook o usuário sobre a fatura excedente
      }

      // Atualizar o currentPeriodEnd para o próximo ciclo
      const nextCycle = new Date(sub.currentPeriodEnd!);
      if (sub.plan!.interval === 'monthly') nextCycle.setMonth(nextCycle.getMonth() + 1);
      else if (sub.plan!.interval === 'semiannual') nextCycle.setMonth(nextCycle.getMonth() + 6);
      else if (sub.plan!.interval === 'yearly') nextCycle.setFullYear(nextCycle.getFullYear() + 1);

      await tx.update(userSubscriptions)
        .set({ currentPeriodEnd: nextCycle, updatedAt: new Date() })
        .where(eq(userSubscriptions.id, sub.id));
        
      processed++;
    });
  }

  return { success: true, processed };
}
