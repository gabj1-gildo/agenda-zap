// setup_supabase_schema.js
// Script para criar o schema completo no Supabase via session pooler
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
  console.log('✅ Conectado ao Supabase!');

  // --- ENUMS ---
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE appointment_status AS ENUM('PENDENTE', 'PAGO', 'CANCELADO');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE billing_status AS ENUM('ACTIVE', 'INACTIVE', 'OVERDUE');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log('✅ ENUMs criados');

  // --- TENANTS ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email varchar(255) UNIQUE,
      password_hash text,
      phone varchar(30),
      accept_payment_on_site boolean DEFAULT true,
      google_calendar_token text,
      evolution_instance_name varchar(120),
      evolution_instance_status varchar(30) DEFAULT 'DISCONNECTED',
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela tenants criada');

  // --- USERS_ADMIN ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS users_admin (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email varchar(255) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role varchar(20) NOT NULL DEFAULT 'SUPERADMIN',
      tenant_id uuid REFERENCES tenants(id),
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela users_admin criada');

  // --- CLIENTS ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone varchar(20) NOT NULL UNIQUE,
      name text,
      whatsapp_name text,
      status varchar(50) DEFAULT 'Ativo',
      funnel_stage varchar(50) DEFAULT 'Lead',
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela clients criada');

  // --- APPOINTMENTS ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      date timestamp NOT NULL,
      service_name text NOT NULL,
      price numeric(10, 2) NOT NULL,
      status appointment_status DEFAULT 'PENDENTE' NOT NULL,
      payment_id varchar(255),
      pix_code text,
      qr_code_url text,
      client_id uuid NOT NULL REFERENCES clients(id),
      tenant_id uuid NOT NULL REFERENCES tenants(id),
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela appointments criada');

  // --- SCHEDULES ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id),
      day_of_week integer NOT NULL,
      start_time varchar(5) NOT NULL,
      end_time varchar(5) NOT NULL,
      interval_start_time varchar(5),
      interval_end_time varchar(5),
      slot_duration integer NOT NULL DEFAULT 30,
      is_active boolean NOT NULL DEFAULT true
    );
  `);
  console.log('✅ Tabela schedules criada');

  // --- CHAT_SESSIONS ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid NOT NULL REFERENCES clients(id),
      tenant_id uuid NOT NULL REFERENCES tenants(id),
      status varchar(50) NOT NULL DEFAULT 'ACTIVE',
      current_intent varchar(50),
      history jsonb DEFAULT '[]',
      context jsonb DEFAULT '{}',
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela chat_sessions criada');

  // --- TOKEN_LOGS ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS token_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id),
      tokens_used integer NOT NULL,
      interaction_type varchar(100),
      timestamp timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela token_logs criada');

  // --- BILLING ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS billing (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id),
      plan varchar(50) NOT NULL,
      status billing_status DEFAULT 'ACTIVE' NOT NULL,
      current_period_end timestamp NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela billing criada');

  // --- PAYMENT_KEYS ---
  await client.query(`
    CREATE TABLE IF NOT EXISTS payment_keys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id),
      name varchar(255) NOT NULL,
      gateway varchar(50) NOT NULL,
      token text NOT NULL,
      is_active boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('✅ Tabela payment_keys criada');

  // Listar todas as tabelas criadas
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.log('\n📋 Tabelas no Supabase:', res.rows.map((r) => r.table_name));

  await client.end();
  console.log('\n🎉 Schema criado com sucesso!');
}

run().catch((e) => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
