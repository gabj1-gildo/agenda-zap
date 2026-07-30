import { db } from '../src/db';
import { tenants } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { PATCH } from '../src/app/api/settings/tenant/route';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

async function runTests() {
  console.log("=== TESTANDO ENDPOINT DE CONFIGURAÇÃO (FASE 4) ===\n");

  const tenantResult = await db.select().from(tenants).where(eq(tenants.name, 'Barbearia Teste IA (Migration)')).limit(1);
  const tenant = tenantResult[0];
  if (!tenant) return console.log("Tenant não encontrado.");

  // Gerar um token JWT fake válido para o middleware de auth
  const token = jwt.sign({ 
    id: 'fake-user-id',
    role: 'ADMIN',
    tenants: [{ id: tenant.id, name: tenant.name }]
  }, env.JWT_SECRET || 'secret');
  
  // Como o auth local testa session, vamos injetar uma função global no global.verifyAuth se der?
  // O verifyAuth do route puxa do Header Authorization: Bearer. 
  // Na verdade não podemos mockar tão fácil o canAccessTenant sem popular user_tenants, mas vamos tentar fazer um mock da req Request 
  // Wait, actually testing the NEXT route directly in Node requires mocking Request and DB. 
  // A better way is to just call a local instance of node if the server is running, or simulate the logic directly.
  // Instead of testing via Next.js Route Handler, I will create a dummy Request.
  
  // Vamos injetar os dados diretamente no update igual a route.ts faria:
  console.log("--- TESTE 1: Limite de 500 Caracteres ---");
  
  const longText = "a".repeat(501);
  const body1 = { aiConfig: { restricoes: longText } };
  
  const req1 = new Request(`http://localhost/api/settings/tenant`, {
    method: 'PATCH',
    headers: {
      'tenant-id': tenant.id,
      'authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body1)
  });

  // auth is now mocked via JWT token in the request

  try {
    const res1 = await PATCH(req1);
    const data1 = await res1.json();
    console.log("Resultado do PATCH 1 (> 500 chars):");
    console.log(data1);
  } catch(e: any) {
    console.log("Falhou a chamada PATCH 1:", e.message);
  }

  console.log("\n--- TESTE 2: Compatibilidade de Campos Legados ---");
  // Vamos colocar no banco manualmente os campos legados para simular um tenant antigo
  await db.update(tenants).set({
    aiConfig: {
      servicos_precos: "Corte: 50, Barba: 30",
      horario_funcionamento: "Seg a Sex 08-18",
      tom_atendimento: "Cordial"
    }
  }).where(eq(tenants.id, tenant.id));

  // O Frontend envia um payload com os dados novos, ou tenta salvar outra configuração, enviando os dados antigos junto
  const body2 = { 
    aiConfig: { 
      servicos_precos: "Corte: 50, Barba: 30", // front enviou de volta sem querer
      horario_funcionamento: "Seg a Sex 08-18", 
      tom_atendimento: "Muito Cordial" // alterado
    } 
  };
  
  const req2 = new Request(`http://localhost/api/settings/tenant`, {
    method: 'PATCH',
    headers: { 'tenant-id': tenant.id, 'authorization': `Bearer ${token}` },
    body: JSON.stringify(body2)
  });

  try {
    const res2 = await PATCH(req2);
    const data2 = await res2.json();
    console.log("Resultado do PATCH 2 (Campos Legados):");
    console.log(data2.success ? "Sucesso!" : "Falhou: " + data2.error);
    
    // Verificando o DB
    const finalTenant = await db.select().from(tenants).where(eq(tenants.id, tenant.id)).limit(1);
    console.log("\naiConfig resultante no banco de dados:");
    console.log(finalTenant[0].aiConfig);
  } catch(e: any) {
    console.log("Falhou a chamada PATCH 2:", e.message);
  }

  process.exit(0);
}

runTests().catch(console.error);
