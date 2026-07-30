require('dotenv').config();
const { Client } = require('pg');
const argon2 = require('argon2');
const crypto = require('crypto');

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
    
    // 1. Create ENUMs
    console.log('🔧 Criando ENUMs...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE audit_event AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create users table
    console.log('🔧 Criando tabela users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        email varchar(255) NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role varchar(20) NOT NULL,
        tenant_id uuid REFERENCES tenants(id),
        status user_status NOT NULL DEFAULT 'ACTIVE',
        failed_login_attempts integer NOT NULL DEFAULT 0,
        locked_until timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);

    // 3. Create audit_logs table
    console.log('🔧 Criando tabela audit_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id),
        email varchar(255),
        event_type audit_event NOT NULL,
        ip_address varchar(45),
        user_agent text,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    const defaultPassword = 'AgendaZap2026*';
    console.log(`\n🔑 Gerando hash Argon2id para a senha padrão: ${defaultPassword}`);
    const hashed = await argon2.hash(defaultPassword);

    // 4. Migrate SuperAdmins
    console.log('📦 Migrando SuperAdmins...');
    const adminsRes = await client.query('SELECT * FROM users_admin');
    for (const admin of adminsRes.rows) {
      // Check if exists in users
      const exists = await client.query('SELECT id FROM users WHERE email = $1', [admin.email]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO users (id, name, email, password_hash, role, tenant_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          admin.id,
          'Administrador',
          admin.email,
          hashed,
          admin.role || 'SUPERADMIN',
          admin.tenant_id,
          admin.created_at,
          admin.updated_at
        ]);
        console.log(`   ✅ Migrado: ${admin.email}`);
      }
    }

    // 5. Migrate Tenants
    console.log('📦 Migrando Lojistas (Tenants)...');
    const tenantsRes = await client.query('SELECT * FROM tenants WHERE email IS NOT NULL');
    for (const t of tenantsRes.rows) {
      const exists = await client.query('SELECT id FROM users WHERE email = $1', [t.email]);
      if (exists.rows.length === 0) {
        const userId = crypto.randomUUID();
        await client.query(`
          INSERT INTO users (id, name, email, password_hash, role, tenant_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          userId,
          t.name,
          t.email,
          hashed,
          'TENANT',
          t.id,
          t.created_at,
          t.updated_at
        ]);
        console.log(`   ✅ Migrado: ${t.email}`);
      }
    }

    // 6. Cleanup old schema
    console.log('\n🧹 Limpando schema antigo...');
    await client.query('DROP TABLE IF EXISTS users_admin CASCADE');
    console.log('   ✅ Tabela users_admin removida');

    // Remove email/password from tenants if columns exist
    await client.query(`
      ALTER TABLE tenants 
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS password_hash;
    `);
    console.log('   ✅ Colunas de auth removidas da tabela tenants');

    await client.query('COMMIT');
    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.end();
  }
}

run();
