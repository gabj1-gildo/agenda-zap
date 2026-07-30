import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { unsyncAppointmentFromCalendar } from '../../googleCalendar';
import { dispatchWebhook } from '@/services/webhookDispatcher';

export async function handleCancelAppointment(args: any, tenant: any, client: any): Promise<string[]> {
  try {
    const { appointmentId } = args;

    const apts = await db.select().from(appointments).where(
      and(eq(appointments.id, appointmentId), eq(appointments.clientId, client.id), eq(appointments.tenantId, tenant.id))
    ).limit(1);

    if (!apts.length) {
      return ["Não consegui encontrar este agendamento ou ele não pertence a você."];
    }

    const appointment = apts[0];

    if (appointment.status === 'CANCELADO') {
      return ["Este agendamento já se encontra cancelado."];
    }

    // Validar antecedência mínima
    const minAdvance = tenant.minAdvanceMinutes || 60;
    const now = new Date();
    const apptDate = new Date(appointment.date);
    
    const diffMs = apptDate.getTime() - now.getTime();
    const diffMins = diffMs / 60000;

    if (diffMins < minAdvance) {
      const hours = Math.floor(minAdvance / 60);
      const mins = minAdvance % 60;
      const timeStr = hours > 0 ? `${hours}h${mins > 0 ? ` e ${mins}m` : ''}` : `${mins} minutos`;
      return [
        `Infelizmente não é possível cancelar este agendamento de forma automática.`,
        `A empresa exige uma antecedência mínima de ${timeStr} para cancelamentos.`,
        `Por favor, aguarde um momento que um de nossos atendentes falará com você para ajudar com isso.`
      ];
    }

    await db.update(appointments).set({ status: 'CANCELADO' }).where(eq(appointments.id, appointmentId));
    
    const { appointmentLogs } = await import('@/db/schema');
    await db.insert(appointmentLogs).values({
      tenantId: tenant.id,
      appointmentId: appointmentId,
      actionByName: 'SISTEMA/IA',
      action: 'UPDATE_STATUS',
      details: { oldStatus: appointment.status, newStatus: 'CANCELADO' }
    });

    // Remove from Google Calendar
    if (appointment.googleEventId) {
      await unsyncAppointmentFromCalendar(appointmentId).catch(e => console.error("Erro ao remover evento do calendar", e));
    }

    dispatchWebhook(tenant.id, 'APPOINTMENT_CANCELED', { appointmentId, serviceName: appointment.serviceName, oldDate: appointment.date }).catch(console.error);

    return [
      `Seu agendamento para o serviço *${appointment.serviceName}* do dia ${apptDate.toLocaleDateString('pt-BR')} às ${apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} foi cancelado com sucesso.`,
      `Esperamos te ver novamente em breve!`
    ];

  } catch (error) {
    console.error('Error cancelAppointment:', error);
    return ['Ocorreu um erro interno ao tentar cancelar seu agendamento. Pode tentar novamente em instantes?'];
  }
}
