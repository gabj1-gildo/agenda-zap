// apply_rls.js
// Aplica as políticas de RLS no Supabase via session pooler
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

  // Criar função auxiliar
  console.log('🔧 Criando função current_tenant_id()...');
  await client.query(`
    CREATE OR REPLACE FUNCTION current_tenant_id()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $$
      SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
    $$;
  `);
  console.log('✅ Função criada\n');

  // Habilitar RLS e criar políticas tabela por tabela
  const tables = [
    {
      name: 'tenants',
      policies: [
        { name: 'tenants_select_own', cmd: 'SELECT', using: "id = current_tenant_id()" },
        { name: 'tenants_update_own', cmd: 'UPDATE', using: "id = current_tenant_id()" },
      ]
    },
    {
      name: 'users',
      policies: [
        { name: 'users_select', cmd: 'SELECT', using: "EXISTS (SELECT 1 FROM user_tenants ut WHERE ut.user_id = users.id AND ut.tenant_id = current_tenant_id()) OR current_tenant_id() IS NULL" },
        { name: 'users_update', cmd: 'UPDATE', using: "EXISTS (SELECT 1 FROM user_tenants ut WHERE ut.user_id = users.id AND ut.tenant_id = current_tenant_id()) OR current_tenant_id() IS NULL" },
      ]
    },
    {
      name: 'user_tenants',
      policies: [
        { name: 'user_tenants_select', cmd: 'SELECT', using: "tenant_id = current_tenant_id() OR current_tenant_id() IS NULL" },
        { name: 'user_tenants_insert', cmd: 'INSERT', check: "tenant_id = current_tenant_id() OR current_tenant_id() IS NULL" },
        { name: 'user_tenants_delete', cmd: 'DELETE', using: "tenant_id = current_tenant_id() OR current_tenant_id() IS NULL" },
      ]
    },
    {
      name: 'clients',
      policies: [
        { name: 'clients_select_via_tenant', cmd: 'SELECT', using: "EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = clients.id AND a.tenant_id = current_tenant_id()) OR EXISTS (SELECT 1 FROM chat_sessions cs WHERE cs.client_id = clients.id AND cs.tenant_id = current_tenant_id())" },
        { name: 'clients_insert', cmd: 'INSERT', check: "true" },
        { name: 'clients_update', cmd: 'UPDATE', using: "EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = clients.id AND a.tenant_id = current_tenant_id()) OR EXISTS (SELECT 1 FROM chat_sessions cs WHERE cs.client_id = clients.id AND cs.tenant_id = current_tenant_id())" },
      ]
    },
    {
      name: 'appointments',
      policies: [
        { name: 'appointments_select', cmd: 'SELECT', using: "tenant_id = current_tenant_id()" },
        { name: 'appointments_insert', cmd: 'INSERT', check: "tenant_id = current_tenant_id()" },
        { name: 'appointments_update', cmd: 'UPDATE', using: "tenant_id = current_tenant_id()" },
        { name: 'appointments_delete', cmd: 'DELETE', using: "tenant_id = current_tenant_id()" },
      ]
    },
    {
      name: 'schedules',
      policies: [
        { name: 'schedules_select', cmd: 'SELECT', using: "tenant_id = current_tenant_id()" },
        { name: 'schedules_insert', cmd: 'INSERT', check: "tenant_id = current_tenant_id()" },
        { name: 'schedules_update', cmd: 'UPDATE', using: "tenant_id = current_tenant_id()" },
        { name: 'schedules_delete', cmd: 'DELETE', using: "tenant_id = current_tenant_id()" },
      ]
    },
    {
      name: 'chat_sessions',
      policies: [
        { name: 'chat_sessions_select', cmd: 'SELECT', using: "tenant_id = current_tenant_id()" },
        { name: 'chat_sessions_insert', cmd: 'INSERT', check: "tenant_id = current_tenant_id()" },
        { name: 'chat_sessions_update', cmd: 'UPDATE', using: "tenant_id = current_tenant_id()" },
        { name: 'chat_sessions_delete', cmd: 'DELETE', using: "tenant_id = current_tenant_id()" },
      ]
    },
    {
      name: 'token_logs',
      policies: [
        { name: 'token_logs_select', cmd: 'SELECT', using: "tenant_id = current_tenant_id()" },
        { name: 'token_logs_insert', cmd: 'INSERT', check: "tenant_id = current_tenant_id()" },
      ]
    },
    {
      name: 'billing',
      policies: [
        { name: 'billing_select', cmd: 'SELECT', using: "tenant_id = current_tenant_id()" },
      ]
    },
    {
      name: 'payment_keys',
      policies: [
        { name: 'payment_keys_select', cmd: 'SELECT', using: "tenant_id = current_tenant_id()" },
        { name: 'payment_keys_insert', cmd: 'INSERT', check: "tenant_id = current_tenant_id()" },
        { name: 'payment_keys_update', cmd: 'UPDATE', using: "tenant_id = current_tenant_id()" },
        { name: 'payment_keys_delete', cmd: 'DELETE', using: "tenant_id = current_tenant_id()" },
      ]
    },
  ];

  for (const table of tables) {
    console.log(`🔒 Habilitando RLS em: ${table.name}`);
    await client.query(`ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY`);

    for (const p of table.policies) {
      // Remover se já existir
      await client.query(`DROP POLICY IF EXISTS "${p.name}" ON ${table.name}`).catch(() => {});

      let sql = `CREATE POLICY "${p.name}" ON ${table.name} FOR ${p.cmd}`;
      if (p.using) sql += ` USING (${p.using})`;
      if (p.check) sql += ` WITH CHECK (${p.check})`;

      await client.query(sql);
      console.log(`   ✅ Policy: ${p.name}`);
    }
  }

  // Verificar resultado
  const res = await client.query(`
    SELECT tablename, COUNT(*) as policies
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename;
  `);
  console.log('\n📋 Resumo de políticas RLS criadas:');
  res.rows.forEach(r => console.log(`   ${r.tablename}: ${r.policies} políticas`));

  await client.end();
  console.log('\n🎉 RLS configurado com sucesso!');
}

run().catch((e) => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
