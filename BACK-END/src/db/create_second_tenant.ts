import 'dotenv/config';
import { db } from './index';
import { users, tenants, userTenants } from './schema';
import argon2 from 'argon2';

async function main() {
  console.log('Criando nova empresa (Tenant 2)...');

  // 1. Criar a nova empresa (Tenant)
  const [tenant] = await db.insert(tenants).values({
    name: 'Consultório Dr. Marcos (Nova Empresa)',
    phone: '5511977777777',
    activePlan: 'PRO',
    evolutionInstanceName: 'whatsapp-empresa-2'
  }).returning();

  console.log(`Empresa criada com sucesso! ID: ${tenant.id}`);

  // 2. Criar o usuário para a nova empresa
  const passwordHash = await argon2.hash('123456');
  
  const [tenantUser] = await db.insert(users).values({
    email: 'marcos@teste.com',
    name: 'Dr. Marcos',
    passwordHash,
    role: 'TENANT',
  }).returning();

  console.log(`Usuário criado com sucesso! ID: ${tenantUser.id}`);

  // 3. Vincular usuário à empresa
  await db.insert(userTenants).values({
    userId: tenantUser.id,
    tenantId: tenant.id,
  });

  console.log('====================================');
  console.log('Dados da Nova Empresa criados com sucesso!');
  console.log('--- DADOS DE ACESSO ---');
  console.log('Usuário (Tenant 2):');
  console.log('  Login: marcos@teste.com');
  console.log('  Senha: 123456');
  console.log('====================================');
  
  process.exit(0);
}

main().catch((e) => {
  console.error('Erro ao criar empresa:', e);
  process.exit(1);
});
