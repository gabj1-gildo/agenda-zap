import 'dotenv/config';
import { db } from './index';
import { users } from './schema/users';
import { tenants } from './schema/tenants';
import { userTenants } from './schema/userTenants';
import { auditLogs } from './schema/auditLogs';
import { refreshTokens } from './schema/refreshTokens';
import { clients } from './schema/clients';
import { clientTags } from './schema/clientTags';
import { chatSessions } from './schema/chatSessions';
import { appointments } from './schema/appointments';
import { schedules } from './schema/schedules';
import { paymentKeys } from './schema/paymentKeys';
import { tokenLogs } from './schema/tokenLogs';
import { billing } from './schema/billing';
import { tags } from './schema/tags';
import { hashPassword } from '../lib/password';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

async function main() {
  console.log('Limpando o banco de dados (TRUNCATE CASCADE)...');
  
  // Truncate tables. We use raw SQL for this.
  await db.execute(sql`
    TRUNCATE TABLE 
      audit_logs,
      refresh_tokens,
      appointments,
      client_tags,
      chat_sessions,
      clients,
      tags,
      user_tenants,
      schedules,
      payment_keys,
      token_logs,
      billing,
      users,
      tenants
    CASCADE;
  `);

  console.log('Banco de dados limpo!');

  console.log('Criando usuário Admin...');

  const passwordHash = await hashPassword('AdminSeguro2026!');
  const adminId = crypto.randomUUID();
  
  // Gerar PIN no formato xxyyzz
  const d1 = crypto.randomInt(0, 10).toString();
  const d2 = crypto.randomInt(0, 10).toString();
  const d3 = crypto.randomInt(0, 10).toString();
  const superAdminPin = `${d1}${d1}${d2}${d2}${d3}${d3}`; // ex: 112233

  await db.insert(users).values({
    id: adminId,
    name: 'Administrador Global',
    email: 'admin@agenda.ai',
    passwordHash,
    role: 'SUPERADMIN',
    status: 'ACTIVE',
    mustResetPassword: false,
    pin: superAdminPin
  });

  console.log('--------------------------------------------------');
  console.log('✅ Usuário Super Admin criado com sucesso!');
  console.log('📧 Email: admin@agenda.ai');
  console.log('🔑 Senha: AdminSeguro2026!');
  console.log(`🔐 PIN de Segurança (Ações Restritas): ${superAdminPin}`);
  console.log('--------------------------------------------------');

  process.exit(0);
}

main().catch(err => {
  console.error('Erro ao limpar/inserir no banco:', err);
  process.exit(1);
});
