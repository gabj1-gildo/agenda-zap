import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log('🔧 Adicionando colunas faltantes na tabela tenants...');

    // CPF fields
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cpf_birth_date varchar(20);`);
    console.log('✅ cpf_birth_date');

    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cpf_gender varchar(20);`);
    console.log('✅ cpf_gender');

    // Service location fields
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS service_location_type varchar(20) DEFAULT 'ON_SITE' NOT NULL;`);
    console.log('✅ service_location_type');

    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS service_perimeter text;`);
    console.log('✅ service_perimeter');

    // Custom WhatsApp instances
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_max_whatsapp_instances integer;`);
    console.log('✅ custom_max_whatsapp_instances');

    // Logo
    await db.execute(sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text;`);
    console.log('✅ logo_url');

    // Schedules - professional and room FK columns
    await db.execute(sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE;`);
    console.log('✅ schedules.professional_id');

    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rooms') THEN
          CREATE TABLE rooms (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id uuid NOT NULL REFERENCES tenants(id),
            name varchar(255) NOT NULL,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp NOT NULL DEFAULT now(),
            updated_at timestamp NOT NULL DEFAULT now()
          );
        END IF;
      END $$;
    `);
    console.log('✅ rooms table (created if not exists)');

    await db.execute(sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES rooms(id) ON DELETE CASCADE;`);
    console.log('✅ schedules.room_id');

    await db.execute(sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS interval_start_time varchar(5);`);
    console.log('✅ schedules.interval_start_time');

    await db.execute(sql`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS interval_end_time varchar(5);`);
    console.log('✅ schedules.interval_end_time');

    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao migrar:', error);
  }
  process.exit(0);
}

run();
