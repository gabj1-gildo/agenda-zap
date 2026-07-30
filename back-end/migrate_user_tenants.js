require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("❌ Variável de ambiente DIRECT_URL não definida no .env");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('✅ Conectado ao Supabase!\n');

  try {
    await client.query('BEGIN');
    
    console.log('🔧 Criando tabela user_tenants...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tenants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(user_id, tenant_id)
      );
    `);

    console.log('📦 Migrando dados de tenant_id de users para user_tenants...');
    const usersRes = await client.query('SELECT id, tenant_id FROM users WHERE tenant_id IS NOT NULL');
    for (const user of usersRes.rows) {
      await client.query(`
        INSERT INTO user_tenants (user_id, tenant_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, tenant_id) DO NOTHING
      `, [user.id, user.tenant_id]);
    }
    console.log(`   ✅ Migrado ${usersRes.rows.length} ligações.`);

    console.log('\n🧹 Limpando schema antigo (removendo tenant_id de users)...');
    await client.query(`
      DROP POLICY IF EXISTS "users_select" ON users;
      DROP POLICY IF EXISTS "users_update" ON users;
      ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
    `);
    console.log('   ✅ Coluna tenant_id removida de users.');

    await client.query('COMMIT');
    console.log('\n🎉 Migração de múltiplos tenants concluída com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.end();
  }
}

run();
