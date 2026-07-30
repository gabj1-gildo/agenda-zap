import 'dotenv/config';
import { db } from './index';
import { sql } from 'drizzle-orm';
import { users, tenants, userTenants, clients, appointments } from './schema';
import argon2 from 'argon2';

async function main() {
  console.log('Iniciando limpeza do banco de dados...');
  
  // Truncate tables
  await db.execute(sql`TRUNCATE TABLE users, tenants, user_tenants, clients, appointments, schedules, chat_sessions, token_logs, audit_logs CASCADE;`);
  
  console.log('Banco de dados limpo com sucesso.');
  console.log('Inserindo dados de teste...');

  // 1. SuperAdmin
  const passwordHash = await argon2.hash('123456');
  
  const [admin] = await db.insert(users).values({
    email: 'admin@agenda.ai',
    name: 'Administrador',
    passwordHash,
    role: 'SUPERADMIN',
  }).returning();

  // 2. Tenant
  const [tenant] = await db.insert(tenants).values({
    name: 'Clínica Odonto Teste',
    phone: '5511999999999',
    activePlan: 'PRO',
  }).returning();

  // 3. Tenant User
  const [tenantUser] = await db.insert(users).values({
    email: 'dentista@teste.com',
    name: 'Dr. Teste',
    passwordHash,
    role: 'TENANT',
  }).returning();

  await db.insert(userTenants).values({
    userId: tenantUser.id,
    tenantId: tenant.id,
  });

  // 4. Client
  const [client1] = await db.insert(clients).values({
    name: 'João da Silva',
    phone: '5511988888888',
    whatsappName: 'João Silva',
    tenantId: tenant.id,
  }).returning();

  // 5. Appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  await db.insert(appointments).values({
    clientId: client1.id,
    tenantId: tenant.id,
    date: tomorrow,
    serviceName: 'Limpeza Dental',
    price: '150.00',
    status: 'PENDENTE',
  });

  console.log('====================================');
  console.log('Dados de teste inseridos com sucesso!');
  console.log('--- DADOS DE ACESSO ---');
  console.log('SuperAdmin:');
  console.log('  Login: admin@agenda.ai');
  console.log('  Senha: 123456');
  console.log('');
  console.log('Usuário da Clínica (Tenant):');
  console.log('  Login: dentista@teste.com');
  console.log('  Senha: 123456');
  console.log('====================================');
  
  process.exit(0);
}

main().catch((e) => {
  console.error('Erro ao popular banco de dados:', e);
  process.exit(1);
});
