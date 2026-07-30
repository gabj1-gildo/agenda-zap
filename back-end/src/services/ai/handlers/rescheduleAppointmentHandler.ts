import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateEventInCalendar } from '../../googleCalendar';
import { handleCheckAvailability } from './checkAvailabilityHandler';
import { dispatchWebhook } from '@/services/webhookDispatcher';

export async function handleRescheduleAppointment(args: any, tenant: any, client: any): Promise<string[]> {
  try {
    const { appointmentId, newDateIso } = args;

    const apts = await db.select().from(appointments).where(
      and(eq(appointments.id, appointmentId), eq(appointments.clientId, client.id), eq(appointments.tenantId, tenant.id))
    ).limit(1);

    if (!apts.length) {
      return ["Não consegui encontrar este agendamento ou ele não pertence a você."];
    }

    const appointment = apts[0];

    if (appointment.status === 'CANCELADO') {
      return ["Este agendamento já se encontra cancelado. Gostaria de fazer um novo agendamento?"];
    }

    // Validar antecedência mínima em relação à data ATUAL do agendamento (regra para barrar cancelamento em cima da hora)
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
        `Infelizmente não é possível reagendar este horário de forma automática.`,
        `A empresa exige uma antecedência mínima de ${timeStr} para alterações na agenda.`,
        `Aguarde um momento que um atendente humano falará com você.`
      ];
    }

    // Validar disponibilidade da nova data usando a mesma lógica de agendamento
    const newDateObj = new Date(newDateIso);
    const dateStr = newDateIso.split('T')[0];
    const availabilityRes = await handleCheckAvailability({ serviceId: appointment.serviceId, dateIso: dateStr }, tenant);
    
    if (availabilityRes.error) {
      return [availabilityRes.error];
    }

    const strTime = newDateObj.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    
    if (!availabilityRes.availableSlots || !availabilityRes.availableSlots.includes(strTime)) {
      return [
        `Infelizmente o horário das ${strTime} não está mais disponível ou é inválido.`,
        `Os horários livres para este dia são: ${availabilityRes.availableSlots ? availabilityRes.availableSlots.join(', ') : 'Nenhum'}`
      ];
    }

    // Passou por todas as validações, podemos reagendar
    await db.update(appointments).set({ date: newDateObj, updatedAt: new Date() }).where(eq(appointments.id, appointmentId));
    
    const { appointmentLogs } = await import('@/db/schema');
    await db.insert(appointmentLogs).values({
      tenantId: tenant.id,
      appointmentId: appointmentId,
      actionByName: 'SISTEMA/IA',
      action: 'RESCHEDULE',
      details: { oldDate: appointment.date.toISOString(), newDate: newDateObj.toISOString() }
    });

    // Atualizar no Google Calendar, caso esteja sincronizado
    if (appointment.googleEventId) {
      // Como não sabemos o duration aqui facilmente, passamos apenas o startTime ou deixamos o GoogleCalendar service calcular
      // Porém updateEventInCalendar já faz o PATCH apenas no que for passado.
      // Se a data/hora mudar, precisamos calcular a duration a partir da difference ou recarregar o service, 
      // mas podemos apenas enviar o startTime e deixar o endTime como startTime + (endTimeAntigo - startTimeAntigo).
      // Mas a tabela de appointments só salva 'date'. Não salva 'endTime'.
      // Então vamos carregar a duração do service para recriar o endTime.
      const { services } = await import('@/db/schema');
      let duration = 60;
      if (appointment.serviceId) {
        const srvs = await db.select().from(services).where(eq(services.id, appointment.serviceId)).limit(1);
        if (srvs.length && srvs[0].durationMinutes) {
          duration = srvs[0].durationMinutes;
        }
      }
      const newEndTimeObj = new Date(newDateObj.getTime() + duration * 60000);

      await updateEventInCalendar(tenant.id, appointment.googleEventId, {
        startTime: newDateObj,
        endTime: newEndTimeObj
      }).catch(e => console.error("Erro ao atualizar evento do calendar", e));
    }

    dispatchWebhook(tenant.id, 'APPOINTMENT_RESCHEDULED', { appointmentId, serviceName: appointment.serviceName, oldDate: appointment.date, newDate: newDateObj }).catch(console.error);

    return [
      `Feito! Seu agendamento do serviço *${appointment.serviceName}* foi remarcado com sucesso.`,
      `Nova data e hora: ${newDateObj.toLocaleDateString('pt-BR')} às ${strTime}.`
    ];

  } catch (error) {
    console.error('Error rescheduleAppointment:', error);
    return ['Ocorreu um erro interno ao tentar reagendar. Tente novamente em instantes.'];
  }
}
