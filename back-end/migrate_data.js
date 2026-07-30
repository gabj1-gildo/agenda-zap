// migrate_data.js
// Exporta tenants e users_admin do banco local e importa no Supabase
require('dotenv').config();
const { Client } = require('pg');

const localDB = new Client({
  connectionString: 'postgres://postgres:password@localhost:5432/agenda_zap',
  ssl: false,
});

const supabaseConnectionString = process.env.DIRECT_URL;
if (!supabaseConnectionString) {
  throw new Error("❌ Variável de ambiente DIRECT_URL não definida no .env");
}

const supabaseDB = new Client({
  connectionString: supabaseConnectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('🔌 Conectando ao banco local...');
  await localDB.connect();
  console.log('✅ Conectado ao banco local!');

  console.log('🔌 Conectando ao Supabase...');
  await supabaseDB.connect();
  console.log('✅ Conectado ao Supabase!\n');

  // --- Exportar TENANTS ---
  let tenants = [];
  try {
    const res = await localDB.query('SELECT * FROM tenants ORDER BY created_at');
    tenants = res.rows;
    console.log(`📦 ${tenants.length} tenant(s) encontrado(s) no banco local`);
  } catch (e) {
    console.log('⚠️  Tabela tenants não encontrada no banco local:', e.message);
  }

  // --- Exportar USERS_ADMIN ---
  let usersAdmin = [];
  try {
    const res = await localDB.query('SELECT * FROM users_admin ORDER BY created_at');
    usersAdmin = res.rows;
    console.log(`📦 ${usersAdmin.length} user(s) admin encontrado(s) no banco local`);
  } catch (e) {
    console.log('⚠️  Tabela users_admin não encontrada no banco local:', e.message);
  }

  await localDB.end();
  console.log('\n📤 Importando para o Supabase...');

  // --- Importar TENANTS ---
  let tenantsImported = 0;
  for (const t of tenants) {
    try {
      await supabaseDB.query(
        `INSERT INTO tenants (
          id, name, email, password_hash, phone, accept_payment_on_site,
          google_calendar_token, evolution_instance_name, evolution_instance_status,
          created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          updated_at = EXCLUDED.updated_at`,
        [
          t.id,
          t.name,
          t.email || null,
          t.password_hash || null,
          t.phone || null,
          t.accept_payment_on_site ?? true,
          t.google_calendar_token || null,
          t.evolution_instance_name || null,
          t.evolution_instance_status || 'DISCONNECTED',
          t.created_at,
          t.updated_at,
        ]
      );
      tenantsImported++;
      console.log(`  ✅ Tenant: ${t.name} (${t.email || 'sem email'})`);
    } catch (e) {
      console.error(`  ❌ Erro ao importar tenant ${t.name}:`, e.message);
    }
  }

  // --- Importar USERS_ADMIN ---
  let usersImported = 0;
  for (const u of usersAdmin) {
    try {
      await supabaseDB.query(
        `INSERT INTO users_admin (
          id, email, password_hash, role, tenant_id, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          updated_at = EXCLUDED.updated_at`,
        [
          u.id,
          u.email,
          u.password_hash,
          u.role || 'SUPERADMIN',
          u.tenant_id || null,
          u.created_at,
          u.updated_at,
        ]
      );
      usersImported++;
      console.log(`  ✅ Admin: ${u.email} [${u.role || 'SUPERADMIN'}]`);
    } catch (e) {
      console.error(`  ❌ Erro ao importar admin ${u.email}:`, e.message);
    }
  }

  await supabaseDB.end();

  console.log('\n🎉 Migração de dados concluída!');
  console.log(`   Tenants importados: ${tenantsImported}/${tenants.length}`);
  console.log(`   Admins importados:  ${usersImported}/${usersAdmin.length}`);
}

run().catch((e) => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});
