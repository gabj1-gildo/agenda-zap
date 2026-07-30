import { db } from '../src/db';
import { tenants, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { handleListServices } from '../src/services/ai/handlers/listServicesHandler';
import { env } from '../src/config/env';
import * as jwt from 'jsonwebtoken';

async function runTests() {
  console.log("=== RE-TESTING PHASE 3: REAL API CALLS ===");

  const tenantResult = await db.select().from(tenants).where(eq(tenants.name, 'Barbearia Teste IA (Migration)')).limit(1);
  let tenant = tenantResult[0];
  if (!tenant) {
    const tenantResult2 = await db.select().from(tenants).limit(1);
    tenant = tenantResult2[0];
  }
  
  if (!tenant) {
    console.log("Tenant não encontrado.");
    return;
  }

  const userResult = await db.select().from(users).limit(1);
  const user = userResult[0];
  
  // Generate a valid JWT token
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

  console.log(`Usando tenantId: ${tenantId}`);

  console.log("\n--- TESTE A: POST /api/settings/services (HTTP) ---");
  const postBody = {
    name: "Serviço Teste API",
    price: 75.00,
    durationMinutes: 45,
    isActive: true
  };
  
  const postRes = await fetch(`${backendUrl}/api/settings/services`, {
    method: 'POST',
    headers,
    body: JSON.stringify(postBody)
  });
  const postData = await postRes.json();
  console.log("POST Result:", postData);
  
  if (!postData.success) {
    console.log("❌ Falha no Teste A");
    return;
  }
  
  const createdServiceId = postData.data.id;

  console.log("\n--- TESTE D: list_services da IA (Verificar Serviço) ---");
  const aiListRes = await handleListServices(tenant);
  console.log("AI list_services result:", JSON.stringify(aiListRes, null, 2));
  
  const foundInAi = Array.isArray(aiListRes.result) && aiListRes.result.some((s: any) => s.id === createdServiceId);
  if (foundInAi) {
    console.log("✅ Serviço encontrado via IA tool list_services!");
  } else {
    console.log("❌ Serviço NÃO encontrado na tool list_services!");
  }

  console.log("\n--- TESTE B: PATCH /api/settings/services (HTTP) ---");
  const patchBody = {
    id: createdServiceId,
    name: "Serviço Teste API (Editado)",
    price: 85.00
  };
  
  const patchRes = await fetch(`${backendUrl}/api/settings/services`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patchBody)
  });
  const patchData = await patchRes.json();
  console.log("PATCH Result:", patchData);

  console.log("\n--- TESTE C: DELETE /api/settings/services (HTTP) ---");
  const deleteRes = await fetch(`${backendUrl}/api/settings/services?id=${createdServiceId}`, {
    method: 'DELETE',
    headers
  });
  const deleteData = await deleteRes.json();
  console.log("DELETE Result:", deleteData);

  console.log("\n--- Verificação final via GET ---");
  const getRes = await fetch(`${backendUrl}/api/settings/services`, { headers });
  const getData = await getRes.json();
  console.log("GET Result (Serviços Atuais):", getData.data.length, "serviços");

  process.exit(0);
}

runTests().catch(console.error);
