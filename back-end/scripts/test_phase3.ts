import { db } from '../src/db';
import { tenants, services, appointments, clients } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { handleListServices } from '../src/services/ai/handlers/listServicesHandler';
import { handleCheckAvailability } from '../src/services/ai/handlers/checkAvailabilityHandler';
import { handleCreateAppointment } from '../src/services/ai/handlers/appointmentHandler';
import { generateAiResponse } from '../src/services/ai/index';

async function runTests() {
  console.log("=== INICIANDO TESTES DA FASE 3 ===");

  const tenantResult = await db.select().from(tenants).where(eq(tenants.name, 'Barbearia Teste IA (Migration)'));
  const tenant = tenantResult[0];
  if (!tenant) {
    console.log("Tenant não encontrado.");
    return;
  }

  // Pegar um client de teste
  const clientResult = await db.select().from(clients).where(eq(clients.tenantId, tenant.id)).limit(1);
  let client = clientResult[0];
  if (!client) {
    console.log("Criando cliente de teste...");
    const [newClient] = await db.insert(clients).values({
      tenantId: tenant.id,
      name: "João Teste",
      phone: "5511999999999"
    }).returning();
    client = newClient;
  }

  // Garante que o tenant tenha um serviço de teste
  const serviceResult = await db.select().from(services).where(eq(services.tenantId, tenant.id)).limit(1);
  let testService = serviceResult[0];
  if (!testService) {
    console.log("Criando serviço de teste...");
    const [newSvc] = await db.insert(services).values({
      tenantId: tenant.id,
      name: "Corte Teste Fase 3",
      price: "55.00",
      durationMinutes: 30,
      isActive: true
    }).returning();
    testService = newSvc;
  }

  console.log("\n--- TESTE A: list_services ---");
  const servicesRes = await handleListServices(tenant);
  console.log("Resultado de list_services:");
  console.log(JSON.stringify(servicesRes, null, 2));
  
  if (!servicesRes.result || !Array.isArray(servicesRes.result)) {
    console.log("❌ Falha no Teste A: Não retornou lista de serviços");
    return;
  }
  const service = testService; // Use the one we ensured exists

  console.log("\n--- TESTE B: check_availability com conflito ---");
  // Inserir um appointment manual para criar conflito
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 5); // 5 dias à frente
  // Garantir que não caia no domingo (onde não tem schedule no nosso db de teste, ou se tiver, ok. Mas vou colocar meio dia)
  testDate.setHours(12, 0, 0, 0); 
  const dateIso = testDate.toISOString().split('T')[0];
  
  // Limpar appointments do tenant para ter um quadro limpo
  await db.delete(appointments).where(eq(appointments.tenantId, tenant.id));

  // Criar o appointment de conflito às 10:00
  const conflictDate = new Date(`${dateIso}T10:00:00-03:00`); // Fuso de SP
  await db.insert(appointments).values({
    tenantId: tenant.id,
    clientId: client.id,
    serviceId: service.id,
    serviceName: service.name,
    price: service.price,
    date: conflictDate,
    status: 'PENDENTE'
  });

  const availabilityRes = await handleCheckAvailability({ serviceId: service.id, dateIso }, tenant);
  console.log(`Verificando dia ${dateIso}. O horário 10:00 NÃO deve aparecer nos disponíveis.`);
  console.log(JSON.stringify(availabilityRes, null, 2));

  console.log("\n--- TESTE C: Condição de Corrida no create_appointment ---");
  // Tentar agendar 14:00 duas vezes ao mesmo tempo
  const targetRaceDateIso = `${dateIso}T14:00:00-03:00`;
  const p1 = handleCreateAppointment({ serviceId: service.id, dateIso: targetRaceDateIso }, tenant, client);
  const p2 = handleCreateAppointment({ serviceId: service.id, dateIso: targetRaceDateIso }, tenant, client);
  
  const [res1, res2] = await Promise.all([p1, p2]);
  
  console.log("Resultado Request 1:");
  console.log(res1);
  console.log("Resultado Request 2:");
  console.log(res2);

  console.log("\n--- TESTE D: Conversa Simulada ---");
  const history = [
    { role: "user", content: "Quais os serviços vocês oferecem?" }
  ];
  
  const aiRes = await generateAiResponse(history, "João", {}, tenant, client);
  console.log("Resposta da IA sobre serviços:");
  console.log(aiRes);

  const history2 = [
    { role: "user", content: "Quais os serviços vocês oferecem?" },
    { role: "model", content: `Temos ${service.name} (R$ 55). O ID interno dele é ${service.id}.` },
    { role: "user", content: `Tem horário na próxima quarta-feira para o serviço ${service.name}?` }
  ];

  const aiRes2 = await generateAiResponse(history2, "João", {}, tenant, client);
  console.log("Resposta da IA sobre horários (deve chamar check_availability internamente e trazer horários):");
  console.log(aiRes2);

  process.exit(0);
}

runTests().catch(console.error);
