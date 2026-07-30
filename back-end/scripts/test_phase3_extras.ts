import { db } from '../src/db';
import { tenants, services, appointments, clients, schedules } from '../src/db/schema';
import { eq, ne } from 'drizzle-orm';
import { handleCheckAvailability } from '../src/services/ai/handlers/checkAvailabilityHandler';
import { handleCreateAppointment } from '../src/services/ai/handlers/appointmentHandler';

async function runTests() {
  console.log("=== INICIANDO TESTES EXTRAS DA FASE 3 ===");

  // Pegar o Tenant A (Barbearia Teste IA (Migration))
  const tenantAResult = await db.select().from(tenants).where(eq(tenants.name, 'Barbearia Teste IA (Migration)'));
  const tenantA = tenantAResult[0];
  if (!tenantA) {
    console.log("Tenant A não encontrado.");
    return;
  }

  // Pegar o Tenant B (criar um se não existir)
  let tenantBResult = await db.select().from(tenants).where(ne(tenants.id, tenantA.id)).limit(1);
  let tenantB = tenantBResult[0];
  if (!tenantB) {
    console.log("Criando Tenant B de teste...");
    const [newTenant] = await db.insert(tenants).values({
      name: "Outra Barbearia Teste",
      phone: "5511888888888"
    }).returning();
    tenantB = newTenant;
  }

  // Pegar clientes para os tenants
  const clientAResult = await db.select().from(clients).where(eq(clients.tenantId, tenantA.id)).limit(1);
  let clientA = clientAResult[0];
  
  const clientBResult = await db.select().from(clients).where(eq(clients.tenantId, tenantB.id)).limit(1);
  let clientB = clientBResult[0];
  if (!clientB) {
    const [newClient] = await db.insert(clients).values({
      tenantId: tenantB.id,
      name: "Cliente do Tenant B",
      phone: "5511777777777"
    }).returning();
    clientB = newClient;
  }

  console.log("\n--- 1. TESTE DE DURAÇÃO (60 MINUTOS) ---");
  // Criar serviço de 60 min no Tenant A
  const [service60m] = await db.insert(services).values({
    tenantId: tenantA.id,
    name: "Serviço Longo 60m",
    price: "100.00",
    durationMinutes: 60,
    isActive: true
  }).returning();

  // Encontrar um dia da semana que tenha schedule para o Tenant A
  const activeSchedules = await db.select().from(schedules).where(eq(schedules.tenantId, tenantA.id)).limit(1);
  const sched = activeSchedules[0];
  if (!sched) {
    console.log("Nenhum schedule ativo para o Tenant A. Criando um para terça-feira...");
    await db.insert(schedules).values({
      tenantId: tenantA.id,
      dayOfWeek: 2, // Terça-feira
      startTime: "08:00",
      endTime: "18:00",
      slotDuration: 30,
      isActive: true
    });
  }
  const dayOfWeek = sched ? sched.dayOfWeek : 2;

  // Criar appointment manual as 10:00 para esse serviço no dia da semana encontrado
  const testDate = new Date();
  while (testDate.getDay() !== dayOfWeek) {
    testDate.setDate(testDate.getDate() + 1);
  }
  if (testDate.getTime() < new Date().getTime() + 24 * 60 * 60 * 1000) {
    testDate.setDate(testDate.getDate() + 7); // Mover para próxima semana
  }
  
  testDate.setHours(12, 0, 0, 0); 
  const dateIso = testDate.toISOString().split('T')[0];
  
  // Limpar appointments do tenantA para ter um quadro limpo
  await db.delete(appointments).where(eq(appointments.tenantId, tenantA.id));

  const conflictDate = new Date(`${dateIso}T10:00:00-03:00`);
  await db.insert(appointments).values({
    tenantId: tenantA.id,
    clientId: clientA.id,
    serviceId: service60m.id,
    serviceName: service60m.name,
    price: service60m.price,
    date: conflictDate,
    status: 'PENDENTE'
  });

  const availabilityRes = await handleCheckAvailability({ serviceId: service60m.id, dateIso }, tenantA);
  console.log(`Checando horários para dia ${dateIso}. Como o agendamento foi 10:00 e dura 60 min, slots de 10:00 E 10:30 NÃO devem aparecer.`);
  if (availabilityRes.availableSlots) {
    const has1000 = availabilityRes.availableSlots.includes('10:00');
    const has1030 = availabilityRes.availableSlots.includes('10:30');
    console.log(`Tem 10:00? ${has1000}`);
    console.log(`Tem 10:30? ${has1030}`);
  }

  console.log("\n--- 2. TESTE DE ISOLAMENTO POR TENANT ---");
  console.log(`Tentando agendar serviço do Tenant A (ID: ${service60m.id}) usando o contexto do Tenant B (ID: ${tenantB.id})`);
  const isolateRes = await handleCreateAppointment({ serviceId: service60m.id, dateIso: `${dateIso}T14:00:00-03:00` }, tenantB, clientB);
  console.log("Resultado retornado pelo handler:");
  console.log(isolateRes);


  console.log("\n--- 3. TESTE DE MANIPULAÇÃO DE PREÇO ---");
  // O preco do service60m é 100.00. Vamos tentar mandar price: 1.00
  const priceRes = await handleCreateAppointment({ 
    serviceId: service60m.id, 
    dateIso: `${dateIso}T15:00:00-03:00`,
    price: 1.00 // Hack tentativo
  }, tenantA, clientA);
  
  console.log("Resultado retornado pelo handler tentando agendar a R$ 1.00:");
  console.log(priceRes);
  
  // Vamos verificar o price salvo no BD
  const appCreated = await db.select().from(appointments).where(
    eq(appointments.tenantId, tenantA.id)
  ).orderBy(appointments.createdAt);
  
  const lastApp = appCreated[appCreated.length - 1];
  console.log(`Preço salvo no banco de dados para este agendamento: R$ ${lastApp.price}`);

  process.exit(0);
}

runTests().catch(console.error);
