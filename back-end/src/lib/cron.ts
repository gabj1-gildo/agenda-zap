import cron from 'node-cron';
import { db } from '@/db';
import { automations } from '@/db/schema/automations';
import { clientPlans } from '@/db/schema/clientPlans';
import { clients } from '@/db/schema/clients';
import { tenants } from '@/db/schema/tenants';
import { lte, eq, and } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/services/whatsappService';

import { processExpireAppointments } from '@/app/api/cron/expire-appointments/route';
import { processReminders } from '@/app/api/cron/reminders/route';
import { processDailyReport } from '@/app/api/cron/daily-report/route';
import { processCheckInstances } from '@/app/api/cron/check-instances/route';
import { processBillingRenewals } from '@/services/billingService';
import { processCloseChats } from '@/services/chatProcessor';

let isCronRunning = false;

export function initCron() {
  if (isCronRunning) return;
  isCronRunning = true;

  console.log('🕒 Iniciando Orquestrador Interno de CRONs (Render/VPS)...');

  // 1. Automações: Roda a cada minuto
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      const pendingAutomations = await db.select({
        automation: automations,
        client: clients,
        tenant: tenants
      })
      .from(automations)
      .innerJoin(clients, eq(automations.clientId, clients.id))
      .innerJoin(tenants, eq(automations.tenantId, tenants.id))
      .where(
        and(
          eq(automations.isActive, true),
          lte(automations.nextRunAt, now)
        )
      );

      for (const row of pendingAutomations) {
        const { automation, client, tenant } = row;

        const [plan] = await db.select().from(clientPlans)
          .where(eq(clientPlans.clientId, client.id))
          .limit(1);

        if (!plan || plan.status !== 'ACTIVE' || new Date(plan.endDate) < now) {
          await db.update(automations).set({ isActive: false }).where(eq(automations.id, automation.id));
          continue;
        }

        if (client.phone && tenant.evolutionInstanceName && tenant.evolutionInstanceStatus === 'CONNECTED') {
          const phoneJid = client.phone.includes('@') ? client.phone : `${client.phone.replace(/\D/g, '')}@s.whatsapp.net`;
          await sendWhatsAppMessage(phoneJid, automation.messageTemplate, tenant.id);
        }

        const nextRun = new Date(automation.nextRunAt);
        nextRun.setDate(nextRun.getDate() + 7);
        while (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }

        await db.update(automations)
          .set({ nextRunAt: nextRun, updatedAt: new Date() })
          .where(eq(automations.id, automation.id));
      }
    } catch (error) {
      console.error('Erro no cron de automações:', error);
    }
  });

  // 2. Expirar Agendamentos Pendentes (a cada 5 minutos)
  cron.schedule('*/5 * * * *', async () => {
    try {
      await processExpireAppointments();
    } catch (error) {
      console.error('Erro no cron expire-appointments:', error);
    }
  });

  // 3. Checar Instâncias WhatsApp (a cada 15 minutos)
  cron.schedule('*/15 * * * *', async () => {
    try {
      await processCheckInstances();
    } catch (error) {
      console.error('Erro no cron check-instances:', error);
    }
  });

  // 4. Enviar Lembretes de Consulta (a cada 1 hora)
  // Como o range é de 2h a 3h no futuro, rodando a cada 1h garantimos pegar todos sem duplicar
  cron.schedule('0 * * * *', async () => {
    try {
      await processReminders();
    } catch (error) {
      console.error('Erro no cron reminders:', error);
    }
  });

  // 4.5 Fechar Chats Ociosos (a cada 1 hora)
  cron.schedule('0 * * * *', async () => {
    try {
      await processCloseChats();
    } catch (error) {
      console.error('Erro no cron close-chats:', error);
    }
  });

  // 5. Relatório Diário de Lojistas (Todos os dias às 20:00)
  cron.schedule('0 20 * * *', async () => {
    try {
      await processDailyReport();
    } catch (error) {
      console.error('Erro no cron daily-report:', error);
    }
  });

  // 6. Faturamento Recorrente (Todos os dias às 00:01)
  cron.schedule('1 0 * * *', async () => {
    try {
      await processBillingRenewals();
    } catch (error) {
      console.error('Erro no cron billing:', error);
    }
  });

  // 7. Backup Automático Diário (Todos os dias às 03:00)
  cron.schedule('0 3 * * *', async () => {
    try {
      // Import dinâmico para não falhar a compilação inicial se houver problema de dependência aws-sdk
      const { runDatabaseBackup } = await import('@/services/backupService');
      await runDatabaseBackup();
    } catch (error) {
      console.error('Erro no cron de backup:', error);
    }
  });
}
