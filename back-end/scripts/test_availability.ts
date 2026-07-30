import { db } from '../src/db';
import { schedules, tenants } from '../src/db/schema';
import { scheduleExceptions } from '../src/db/schema/scheduleExceptions';
import { eq, and } from 'drizzle-orm';

/**
 * Helper function to check if a specific time is open for a tenant on a specific date.
 * dateStr: 'YYYY-MM-DD'
 * timeStr: 'HH:MM'
 */
export async function isTimeOpen(tenantId: string, dateStr: string, timeStr: string): Promise<{ isOpen: boolean, reason: string }> {
  // 1. Check exceptions
  const exceptions = await db.select().from(scheduleExceptions)
    .where(and(
      eq(scheduleExceptions.tenantId, tenantId),
      eq(scheduleExceptions.date, dateStr)
    ));

  const exception = exceptions[0];

  if (exception) {
    if (exception.isClosed) {
      return { isOpen: false, reason: 'Exceção: Estabelecimento fechado neste dia.' };
    }
    if (exception.customStartTime && exception.customEndTime) {
      if (timeStr >= exception.customStartTime && timeStr < exception.customEndTime) {
        return { isOpen: true, reason: 'Exceção: Horário customizado permite atendimento.' };
      }
      return { isOpen: false, reason: 'Exceção: Fora do horário customizado de funcionamento.' };
    }
  }

  // 2. Check regular schedule
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...

  const regularSchedules = await db.select().from(schedules)
    .where(and(
      eq(schedules.tenantId, tenantId),
      eq(schedules.dayOfWeek, dayOfWeek),
      eq(schedules.isActive, true)
    ));

  const schedule = regularSchedules[0];

  if (!schedule) {
    return { isOpen: false, reason: 'Nenhum horário de funcionamento configurado para este dia da semana.' };
  }

  // Check if within main shift
  if (timeStr >= schedule.startTime && timeStr < schedule.endTime) {
    // Check if within interval (e.g. lunch break)
    if (schedule.intervalStartTime && schedule.intervalEndTime) {
      if (timeStr >= schedule.intervalStartTime && timeStr < schedule.intervalEndTime) {
        return { isOpen: false, reason: 'Horário de intervalo.' };
      }
    }
    return { isOpen: true, reason: 'Horário de funcionamento regular.' };
  }

  return { isOpen: false, reason: 'Fora do horário de funcionamento regular.' };
}

async function runTests() {
  console.log("Iniciando testes de disponibilidade...");
  
  // Encontrar o tenant "Barbearia Teste IA" (ou usar um fallback)
  const tenantResult = await db.select().from(tenants).where(eq(tenants.name, 'Barbearia Teste IA (Migration)'));
  let tenantId = tenantResult[0]?.id;
  
  if (!tenantId) {
    console.log("Tenant de teste não encontrado. Encerrando.");
    process.exit(1);
  }

  // Preparar dados de teste
  // Limpar dados anteriores do teste para não acumular
  await db.delete(scheduleExceptions).where(eq(scheduleExceptions.tenantId, tenantId));
  await db.delete(schedules).where(eq(schedules.tenantId, tenantId));

  // Cadastrar um schedule regular para Segunda-feira (dayOfWeek = 1)
  // Horário: 08:00 às 18:00 (sem intervalo para simplificar o teste)
  await db.insert(schedules).values({
    tenantId,
    dayOfWeek: 1, // Segunda
    startTime: '08:00',
    endTime: '18:00',
    isActive: true,
    slotDuration: 30
  });

  console.log("\n==========================================");
  
  // CENÁRIO 1: Segunda-feira normal (sem exceção) - 2026-07-27 é uma segunda-feira
  const dateCenario1 = '2026-07-27'; 
  console.log(`CENÁRIO 1 — Dia normal dentro do horário (${dateCenario1})`);
  const result1 = await isTimeOpen(tenantId, dateCenario1, '10:00');
  console.log(`Teste às 10:00. Esperado: true | Obtido: ${result1.isOpen} | Motivo: ${result1.reason}`);

  // CENÁRIO 2: Segunda-feira de Feriado - 2026-08-03
  const dateCenario2 = '2026-08-03';
  await db.insert(scheduleExceptions).values({
    tenantId,
    date: dateCenario2,
    isClosed: true,
  });
  console.log(`\nCENÁRIO 2 — Exceção fechada (feriado) (${dateCenario2})`);
  const result2 = await isTimeOpen(tenantId, dateCenario2, '10:00');
  console.log(`Teste às 10:00. Esperado: false | Obtido: ${result2.isOpen} | Motivo: ${result2.reason}`);

  // CENÁRIO 3: Segunda-feira com Horário Customizado - 2026-08-10
  const dateCenario3 = '2026-08-10';
  await db.insert(scheduleExceptions).values({
    tenantId,
    date: dateCenario3,
    isClosed: false,
    customStartTime: '09:00',
    customEndTime: '12:00'
  });
  console.log(`\nCENÁRIO 3 — Exceção com horário customizado (${dateCenario3})`);
  const result3_1 = await isTimeOpen(tenantId, dateCenario3, '10:00');
  console.log(`Teste às 10:00. Esperado: true | Obtido: ${result3_1.isOpen} | Motivo: ${result3_1.reason}`);
  const result3_2 = await isTimeOpen(tenantId, dateCenario3, '15:00');
  console.log(`Teste às 15:00. Esperado: false | Obtido: ${result3_2.isOpen} | Motivo: ${result3_2.reason}`);
  
  console.log("==========================================\n");

  process.exit(0);
}

if (require.main === module) {
  runTests().catch(console.error);
}
