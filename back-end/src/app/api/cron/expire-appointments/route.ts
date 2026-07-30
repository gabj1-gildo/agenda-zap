import { NextResponse } from 'next/server';
import { dbAdmin } from '@/db/withTenant';
import { appointments, clients, paymentKeys, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import { env } from '@/config/env';

const CRON_SECRET = env.CRON_SECRET || 'my-super-secret-cron-key';

export async function processExpireAppointments() {
  try {
    // Busca todos os agendamentos pendentes
    const pendingAppointments = await dbAdmin.query.appointments.findMany({
      where: eq(appointments.status, 'PENDENTE'),
      with: {
        client: true,
      }
    });

    if (pendingAppointments.length === 0) {
      return { success: true, message: 'Nenhum agendamento pendente.' };
    }

    // Organiza por tenant
    const tenantIds = [...new Set(pendingAppointments.map(a => a.tenantId))];
    const expiredCount = { value: 0 };

    for (const tenantId of tenantIds) {
      const activeKey = await dbAdmin.query.paymentKeys.findFirst({
        where: and(eq(paymentKeys.tenantId, tenantId), eq(paymentKeys.isActive, true))
      });

      const tenantData = await dbAdmin.query.tenants.findFirst({
        where: eq(tenants.id, tenantId)
      });

      let totalMinutes = 30; // default 30 min
      if (activeKey?.pixExpirationTime) {
        const [hours, minutes] = activeKey.pixExpirationTime.split(':').map(Number);
        totalMinutes = (hours * 60) + minutes;
      }

      const tenantPending = pendingAppointments.filter(a => a.tenantId === tenantId);

      for (const apt of tenantPending) {
        const expirationTime = new Date(apt.createdAt.getTime() + totalMinutes * 60000);
        
        if (new Date() > expirationTime) {
          // Expirou! Mas antes, checar se não foi pago
          let actuallyPaid = false;

          if (apt.paymentId && apt.paymentId !== 'Manual' && activeKey) {
            if (activeKey.gateway === 'MERCADOPAGO') {
              try {
                const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${apt.paymentId}`, {
                  headers: { Authorization: `Bearer ${activeKey.token}` }
                });
                if (mpResponse.ok) {
                  const mpData = await mpResponse.json();
                  if (mpData.status === 'approved') actuallyPaid = true;
                }
              } catch (e) {
                console.error('Erro ao verificar MP no cron:', e);
              }
            } else if (activeKey.gateway === 'ABACATEPAY') {
              // AbacatePay verifica...
            }
          }

          if (actuallyPaid) {
            await dbAdmin.update(appointments).set({ status: 'PAGO' }).where(eq(appointments.id, apt.id));
            continue;
          }
          
          // 1. Atualizar agendamento para CANCELADO
          await dbAdmin.update(appointments)
            .set({ status: 'CANCELADO' })
            .where(eq(appointments.id, apt.id));

          // 2. Atualizar cliente para funil 'perdido'
          await dbAdmin.update(clients)
            .set({ funnelStage: 'perdido' })
            .where(eq(clients.id, apt.clientId));

          // 3. Enviar mensagem de aviso no WhatsApp
          if (apt.client?.phone) {
            const message = `Olá, ${apt.client.name || 'cliente'}. Informamos que o seu agendamento para *${apt.serviceName}* foi cancelado porque o tempo limite para pagamento expirou. O horário foi liberado na nossa agenda.\n\nCaso queira reagendar, basta iniciar um novo atendimento!`;
            await sendWhatsAppMessage(apt.client.phone, message, tenantData?.id || undefined);
          }

          expiredCount.value++;
        }
      }
    }

    return { success: true, message: `${expiredCount.value} agendamentos expirados e cancelados.` };
  } catch (error) {
    console.error('Error in processExpireAppointments:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const querySecret = url.searchParams.get('secret');
    const providedSecret = (authHeader && authHeader.startsWith('Bearer ')) 
      ? authHeader.split(' ')[1] 
      : querySecret;

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processExpireAppointments();
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
