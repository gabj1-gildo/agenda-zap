import { db } from '../src/db';
import { tenants, users, userTenants } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/lib/password';

async function createTestUser() {
  console.log("=== CRIANDO USUÁRIO DE TESTES ===");

  const email = "testuser@agenda.ai";
  const plainPassword = "TestUser123!";

  // Check if test user already exists
  const existingUserResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let user = existingUserResult[0];

  if (!user) {
    console.log(`Usuário ${email} não existe. Criando agora...`);
    const hashedPassword = await hashPassword(plainPassword);
    
    const [newUser] = await db.insert(users).values({
      name: "Usuário de Teste IA",
      email: email,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      mustResetPassword: false
    }).returning();
    
    user = newUser;
    console.log(`✅ Usuário ${email} criado com sucesso (ID: ${user.id}).`);
  } else {
    console.log(`Usuário ${email} já existe (ID: ${user.id}). Atualizando senha...`);
    const hashedPassword = await hashPassword(plainPassword);
    const [updatedUser] = await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, user.id)).returning();
    user = updatedUser;
    console.log(`✅ Senha do usuário ${email} atualizada com sucesso.`);
  }

  // Assign user to test tenant
  const tenantResult = await db.select().from(tenants).where(eq(tenants.name, 'Barbearia Teste IA (Migration)')).limit(1);
  let tenant = tenantResult[0];
  if (!tenant) {
    const backupTenantResult = await db.select().from(tenants).limit(1);
    tenant = backupTenantResult[0];
  }

  if (tenant) {
    console.log(`Vinculando usuário ao Tenant: ${tenant.name}`);
    const existingLink = await db.select().from(userTenants).where(
      eq(userTenants.userId, user.id)
    ).limit(1);
    // Filtering userTenants by both is a bit annoying with drizzle 'and', so we'll just insert if empty or ignore
    // wait, we can just check if any link exists for this user and tenant
    const linkExists = existingLink.find(l => l.tenantId === tenant.id);
    if (!linkExists) {
      await db.insert(userTenants).values({
        userId: user.id,
        tenantId: tenant.id
      });
      console.log(`✅ Vínculo com Tenant criado.`);
    } else {
      console.log(`✅ Usuário já estava vinculado ao Tenant.`);
    }
  }

  console.log("\n=== TESTE PRONTO ===");
  console.log(`Email: ${email}`);
  console.log(`Senha: ${plainPassword}`);
  console.log("Utilizaremos essas credenciais para testes de IA a partir de agora.");

  process.exit(0);
}

createTestUser().catch(console.error);
