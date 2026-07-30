import { db } from '../src/db';
import { tenants, users, services } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { handleCheckAvailability } from '../src/services/ai/handlers/checkAvailabilityHandler';
import { env } from '../src/config/env';
import * as jwt from 'jsonwebtoken';

async function runTests() {
  console.log("=== INICIANDO TESTES: FOLGAS E FERIADOS (EXCEÇÕES DE HORÁRIO) ===");

  const tenantResult = await db.select().from(tenants).where(eq(tenants.name, 'Barbearia Teste IA (Migration)')).limit(1);
  let tenant = tenantResult[0];
  if (!tenant) {
    const tenantResult2 = await db.select().from(tenants).limit(1);
    tenant = tenantResult2[0];
  }
  
  if (!tenant) {
    console.log("❌ Tenant não encontrado.");
    return;
  }

  // Usar o usuário de teste testuser@agenda.ai
  const userResult = await db.select().from(users).where(eq(users.email, 'testuser@agenda.ai')).limit(1);
  const user = userResult[0];
  
  if (!user) {
    console.log("❌ Usuário testuser@agenda.ai não encontrado. Rode o script create_test_user.ts primeiro.");
    return;
  }

  // 1. Obter ou criar um serviço para poder rodar o checkAvailability
  const serviceResult = await db.select().from(services).where(eq(services.tenantId, tenant.id)).limit(1);
  let service = serviceResult[0];
  if (!service) {
    const [newService] = await db.insert(services).values({
      tenantId: tenant.id,
      name: "Serviço Teste Folga",
      price: "10.00",
      durationMinutes: 30,
      isActive: true
    }).returning();
    service = newService;
  }

  // Generate JWT for API tests
  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'SUPERADMIN' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';
  const tenantId = tenant.id;
  const headers = {
    'Content-Type': 'application/json',
    'tenant-id': tenantId,
    'Authorization': `Bearer ${token}`
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateHoliday = tomorrow.toISOString().split('T')[0];

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dateCustom = dayAfter.toISOString().split('T')[0];

  let exceptionHolidayId: string | null = null;
  let exceptionCustomId: string | null = null;

  try {
    console.log("\n--- TESTE A: POST Exceção Fechada (Feriado) ---");
    const resA = await fetch(`${backendUrl}/api/settings/schedule-exceptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: dateHoliday,
        isClosed: true
      })
    });
    const dataA = await resA.json();
    if (dataA.success) {
      console.log(`✅ Sucesso. Feriado criado para o dia ${dateHoliday}. ID: ${dataA.data.id}`);
      exceptionHolidayId = dataA.data.id;
    } else {
      console.log("❌ Falha no Teste A:", dataA.error);
    }

    console.log("\n--- TESTE B: POST Exceção Horário Customizado ---");
    const resB = await fetch(`${backendUrl}/api/settings/schedule-exceptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: dateCustom,
        isClosed: false,
        customStartTime: "10:00",
        customEndTime: "14:00"
      })
    });
    const dataB = await resB.json();
    if (dataB.success) {
      console.log(`✅ Sucesso. Horário Customizado (10:00 - 14:00) criado para o dia ${dateCustom}. ID: ${dataB.data.id}`);
      exceptionCustomId = dataB.data.id;
    } else {
      console.log("❌ Falha no Teste B:", dataB.error);
    }

    console.log("\n--- TESTE D: checkAvailabilityHandler() usando Ferramenta da IA ---");
    
    console.log(`> Checando disponibilidade no Feriado (${dateHoliday}):`);
    const checkHoliday = await handleCheckAvailability({ serviceId: service.id, dateIso: dateHoliday }, tenant);
    if (checkHoliday.result === 'Estabelecimento fechado neste dia.') {
      console.log("✅ Correto! A IA detectou que está fechado.");
    } else {
      console.log("❌ Falha! IA retornou:", checkHoliday);
    }

    console.log(`> Checando disponibilidade no Dia Customizado (${dateCustom}):`);
    const checkCustom = await handleCheckAvailability({ serviceId: service.id, dateIso: dateCustom }, tenant);
    if (checkCustom.result && typeof checkCustom.result === 'string' && checkCustom.result.includes('Estabelecimento fechado')) {
      console.log("❌ Falha! IA detectou como fechado, mas deveria ter horários.");
    } else {
      console.log("✅ Sucesso! A IA retornou as fatias de horário respeitando o bloqueio:");
      if (checkCustom.availableSlots && checkCustom.availableSlots.length > 0) {
          console.log(`   (Primeiro slot: ${checkCustom.availableSlots[0]}, Último slot: ${checkCustom.availableSlots[checkCustom.availableSlots.length - 1]})`);
          if (checkCustom.availableSlots[0] >= "10:00" && checkCustom.availableSlots[checkCustom.availableSlots.length - 1] <= "14:00") {
             console.log("   ✅ E os slots respeitaram perfeitamente a janela 10:00 - 14:00.");
          } else {
             console.log("   ❌ Erro nas fronteiras dos slots:", checkCustom.availableSlots);
          }
      } else {
          console.log(checkCustom);
      }
    }

    console.log("\n--- TESTE E: PATCH Exceção ---");
    if (exceptionCustomId) {
      console.log("Editando a exceção customizada para alterar o horário para 13:00 - 17:00...");
      const resPatch = await fetch(`${backendUrl}/api/settings/schedule-exceptions`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: exceptionCustomId,
          customStartTime: "13:00",
          customEndTime: "17:00"
        })
      });
      const dataPatch = await resPatch.json();
      if (dataPatch.success && dataPatch.data.customStartTime === "13:00") {
        console.log(`✅ Sucesso. Exceção atualizada via PATCH (Novo Início: ${dataPatch.data.customStartTime}).`);
      } else {
        console.log("❌ Falha no Teste de PATCH:", dataPatch.error || dataPatch);
      }
    }

    console.log("\n--- TESTE C: DELETE Exceção ---");
    if (exceptionCustomId) {
      const resC = await fetch(`${backendUrl}/api/settings/schedule-exceptions?id=${exceptionCustomId}`, {
        method: 'DELETE',
        headers
      });
      const dataC = await resC.json();
      if (dataC.success) {
        console.log(`✅ Sucesso. Exceção ${exceptionCustomId} deletada.`);
      } else {
        console.log("❌ Falha no Teste C:", dataC.error);
      }
    }
    
    // Clean up holiday exception as well
    if (exceptionHolidayId) {
        await fetch(`${backendUrl}/api/settings/schedule-exceptions?id=${exceptionHolidayId}`, {
            method: 'DELETE',
            headers
        });
        console.log(`✅ Limpeza: Feriado deletado.`);
    }

    console.log("\n=== TESTES CONCLUÍDOS COM SUCESSO ===");

  } catch (err) {
    console.error("Erro durante a execução dos testes:", err);
  } finally {
    process.exit(0);
  }
}

runTests().catch(console.error);
