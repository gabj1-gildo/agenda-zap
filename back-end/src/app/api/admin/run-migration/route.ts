import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// One-time migration endpoint - REMOVE AFTER USE
// Protected by a secret token
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET && secret !== 'migrate-2026-08-10') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results: string[] = [];
  const errors: string[] = [];

  const migrations = [
    // tenants - CPF fields
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cpf_birth_date varchar(20)`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cpf_gender varchar(20)`,
    // tenants - service location
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS service_location_type varchar(20) NOT NULL DEFAULT 'ON_SITE'`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS service_perimeter text`,
    // tenants - whatsapp
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_max_whatsapp_instances integer`,
    // tenants - logo
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text`,
    // schedules - interval times
    `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS interval_start_time varchar(5)`,
    `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS interval_end_time varchar(5)`,
    // rooms table
    `CREATE TABLE IF NOT EXISTS rooms (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      capacity integer DEFAULT 1,
      description text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )`,
    // schedules - room and professional FK
    `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE`,
    `ALTER TABLE schedules ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES rooms(id) ON DELETE CASCADE`,
  ];

  for (const migration of migrations) {
    try {
      await db.execute(sql.raw(migration));
      results.push(`✅ OK: ${migration.slice(0, 60)}...`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      // "already exists" errors are OK
      if (msg.includes('already exists') || msg.includes('duplicate column')) {
        results.push(`⏭️  SKIP (already exists): ${migration.slice(0, 60)}...`);
      } else {
        errors.push(`❌ ERROR: ${migration.slice(0, 60)} => ${msg}`);
      }
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors,
  });
}
