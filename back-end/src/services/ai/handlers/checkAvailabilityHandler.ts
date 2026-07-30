import { db } from '@/db';
import { services, schedules, appointments, professionals, professionalServices, rooms } from '@/db/schema';
import { scheduleExceptions } from '@/db/schema/scheduleExceptions';
import { eq, and, inArray, gte, lt } from 'drizzle-orm';

export async function handleCheckAvailability(args: any, tenant: any): Promise<any> {
  try {
    const { serviceId, dateIso, preferredProfessionalId, preferredRoomId } = args; // dateIso expected as YYYY-MM-DD
    
    // 1. Validar e buscar o serviço
    const serviceList = await db.select().from(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id)));
    
    if (serviceList.length === 0) {
      return { error: 'Serviço não encontrado ou inativo.' };
    }
    const service = serviceList[0];
    const durationMinutes = service.durationMinutes || 30;

    // 2. Verificar regras de antecedência
    const now = new Date();
    const targetDate = new Date(`${dateIso}T00:00:00`);
    
    const diffDays = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (tenant.maxAdvanceDays && diffDays > tenant.maxAdvanceDays) {
      return { error: `Só é permitido agendar com no máximo ${tenant.maxAdvanceDays} dias de antecedência.` };
    }
    
    const exceptions = await db.select().from(scheduleExceptions)
      .where(and(eq(scheduleExceptions.tenantId, tenant.id), eq(scheduleExceptions.date, dateIso)));
    
    const exception = exceptions[0];
    if (exception && exception.isClosed) {
      return { result: 'Estabelecimento fechado neste dia.' };
    }

    const dayOfWeek = targetDate.getDay();
    const mode = tenant.schedulingMode || 'GERAL';
    
    // Obter agendas regulares do dia
    let allSchedules = await db.select().from(schedules)
      .where(and(
        eq(schedules.tenantId, tenant.id), 
        eq(schedules.dayOfWeek, dayOfWeek), 
        eq(schedules.isActive, true)
      ));

    // Filtrar schedules pelo modo
    if (mode === 'GERAL') {
      allSchedules = allSchedules.filter(s => !s.professionalId && !s.roomId);
    } else if (mode === 'PROFISSIONAL') {
      allSchedules = allSchedules.filter(s => !!s.professionalId);
      if (preferredProfessionalId) {
        allSchedules = allSchedules.filter(s => s.professionalId === preferredProfessionalId);
      }
    } else if (mode === 'CONSULTORIO') {
      allSchedules = allSchedules.filter(s => !!s.roomId);
      if (preferredRoomId) {
        allSchedules = allSchedules.filter(s => s.roomId === preferredRoomId);
      }
    }

    if (allSchedules.length === 0) {
      if (mode === 'PROFISSIONAL' && preferredProfessionalId) return { result: 'Este profissional não atende neste dia.' };
      return { result: 'Nenhum horário de funcionamento para este dia.' };
    }

    // Se PROFISSIONAL, checar se ele atende o serviço (professionalServices)
    let validProfessionalIds = new Set<string>();
    if (mode === 'PROFISSIONAL') {
      const psList = await db.select().from(professionalServices).where(eq(professionalServices.serviceId, service.id));
      psList.forEach(ps => validProfessionalIds.add(ps.professionalId));
      
      allSchedules = allSchedules.filter(s => validProfessionalIds.has(s.professionalId!));
      if (allSchedules.length === 0) {
        return { result: 'Nenhum profissional disponível atende a este serviço neste dia.' };
      }
    }

    // Obter Profissionais e Salas para montar o nome
    const profs = await db.select().from(professionals).where(eq(professionals.tenantId, tenant.id));
    const profMap = new Map(profs.map(p => [p.id, p.name]));
    
    const rms = await db.select().from(rooms).where(eq(rooms.tenantId, tenant.id));
    const roomMap = new Map(rms.map(r => [r.id, r.name]));

    // 4. Buscar appointments existentes do dia
    const startOfDay = new Date(`${dateIso}T00:00:00Z`);
    const endOfDay = new Date(`${dateIso}T23:59:59Z`);

    const existingAppointments = await db.select().from(appointments)
      .where(and(
        eq(appointments.tenantId, tenant.id),
        gte(appointments.date, startOfDay),
        lt(appointments.date, endOfDay),
        inArray(appointments.status, ['PENDENTE', 'PAGO'])
      ));

    // Converter appointments para ocupações por recurso (id do tenant, prof ou room)
    const occupiedByResource = new Map<string, {start: number, end: number}[]>();

    for (const app of existingAppointments) {
      let appDuration = 30; 
      if (app.serviceId) {
        const appSvc = await db.select().from(services).where(eq(services.id, app.serviceId));
        if (appSvc[0] && appSvc[0].durationMinutes) appDuration = appSvc[0].durationMinutes;
      }
      
      const appDate = new Date(app.date);
      const strTime = appDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      const [h, m] = strTime.split(':').map(Number);
      const startMins = (h * 60) + m;
      const endMins = startMins + appDuration;
      
      let resId = tenant.id;
      if (mode === 'PROFISSIONAL' && app.professionalId) resId = app.professionalId;
      if (mode === 'CONSULTORIO' && app.roomId) resId = app.roomId;

      if (!occupiedByResource.has(resId)) occupiedByResource.set(resId, []);
      occupiedByResource.get(resId)!.push({ start: startMins, end: endMins });
    }

    const minAdvance = tenant.minAdvanceMinutes || 60;
    const nowMinsFromMidnight = now.getHours() * 60 + now.getMinutes();
    const isToday = (targetDate.toDateString() === now.toDateString());

    const availableSlots: any[] = [];

    // Para cada schedule, gerar blocos
    for (const schedule of allSchedules) {
      let timeBlocks: {start: string, end: string}[] = [];
      if (exception && exception.customStartTime && exception.customEndTime) {
        timeBlocks.push({ start: exception.customStartTime, end: exception.customEndTime });
      } else {
        if (schedule.intervalStartTime && schedule.intervalEndTime) {
          timeBlocks.push({ start: schedule.startTime, end: schedule.intervalStartTime });
          timeBlocks.push({ start: schedule.intervalEndTime, end: schedule.endTime });
        } else {
          timeBlocks.push({ start: schedule.startTime, end: schedule.endTime });
        }
      }

      let resId = tenant.id;
      let resName = "Geral";
      if (mode === 'PROFISSIONAL' && schedule.professionalId) {
        resId = schedule.professionalId;
        resName = profMap.get(resId) || 'Profissional';
      }
      if (mode === 'CONSULTORIO' && schedule.roomId) {
        resId = schedule.roomId;
        resName = roomMap.get(resId) || 'Sala';
      }

      const occupiedSlots = occupiedByResource.get(resId) || [];

      for (const block of timeBlocks) {
        const [sh, sm] = block.start.split(':').map(Number);
        const [eh, em] = block.end.split(':').map(Number);
        const blockStartMins = (sh * 60) + sm;
        const blockEndMins = (eh * 60) + em;

        for (let currentMins = blockStartMins; currentMins + durationMinutes <= blockEndMins; currentMins += 30) {
          if (isToday && (currentMins < nowMinsFromMidnight + minAdvance)) continue;

          const slotEndMins = currentMins + durationMinutes;
          const hasConflict = occupiedSlots.some(occ => (currentMins < occ.end) && (slotEndMins > occ.start));

          if (!hasConflict) {
            const hh = Math.floor(currentMins / 60).toString().padStart(2, '0');
            const mm = (currentMins % 60).toString().padStart(2, '0');
            
            // Formatamos para a IA entender. A IA precisa do time, professionalId/roomId.
            const slotStr = `${hh}:${mm}`;
            const existing = availableSlots.find(s => s.time === slotStr);
            if (existing) {
              if (mode === 'PROFISSIONAL' && !existing.professionals.find((p:any) => p.id === resId)) {
                existing.professionals.push({ id: resId, name: resName });
              }
              if (mode === 'CONSULTORIO' && !existing.rooms.find((r:any) => r.id === resId)) {
                existing.rooms.push({ id: resId, name: resName });
              }
            } else {
              availableSlots.push({
                time: slotStr,
                professionals: mode === 'PROFISSIONAL' ? [{ id: resId, name: resName }] : undefined,
                rooms: mode === 'CONSULTORIO' ? [{ id: resId, name: resName }] : undefined
              });
            }
          }
        }
      }
    }

    if (availableSlots.length === 0) {
      return { result: 'Nenhum horário disponível para este dia.' };
    }

    // Sort slots by time
    availableSlots.sort((a, b) => a.time.localeCompare(b.time));

    return { 
      result: 'Horários disponíveis', 
      availableSlots,
      schedulingMode: mode,
      serviceInfo: {
        name: service.name,
        price: service.price,
        durationMinutes
      }
    };

  } catch (error) {
    console.error('Error checkAvailability:', error);
    return { error: 'Falha interna ao consultar horários.' };
  }
}
