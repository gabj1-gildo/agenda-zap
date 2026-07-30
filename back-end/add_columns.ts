import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log('Adicionando novas colunas de endereço na tabela tenants...');
    await db.execute(sql`ALTER TABLE tenants DROP COLUMN IF EXISTS address;`);
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cep varchar(15);`);
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_street varchar(255);`);
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_number varchar(50);`);
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_complement varchar(255);`);
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_neighborhood varchar(150);`);
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_city varchar(150);`);
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address_state varchar(2);`);
    console.log('Migração de endereço concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao migrar:', error);
  }
  process.exit(0);
}

run();
