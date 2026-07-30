import 'dotenv/config';
import { db } from './index';
import { users } from './schema';
import argon2 from 'argon2';

async function main() {
  console.log('Seeding: criando SuperAdmin...');

  await db.insert(users).values({
    email: 'admin@agenda.ai',
    passwordHash: await argon2.hash('123456'),
    role: 'SUPERADMIN',
  });

  console.log('Seed concluído! Login: admin@agenda.ai / 123456');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
