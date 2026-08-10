import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// One-time migration: create missing tables in production
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');

  if (secret !== 'migrate-2026-08-10-v2') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results: string[] = [];
  const errors: string[] = [];

  const migrations = [
    // tags table
    `CREATE TABLE IF NOT EXISTS tags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name varchar(50) NOT NULL,
      color varchar(20) NOT NULL DEFAULT '#3b82f6',
      created_at timestamp NOT NULL DEFAULT now()
    )`,
    // client_tags table
    `CREATE TABLE IF NOT EXISTS client_tags (
      client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (client_id, tag_id)
    )`,
    // message_templates table
    `CREATE TABLE IF NOT EXISTS message_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      content text NOT NULL,
      media_url text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )`,
    // funnel_stage column on clients (if not exists)
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS funnel_stage varchar(50) DEFAULT 'espera'`,
  ];

  for (const migration of migrations) {
    try {
      await db.execute(sql.raw(migration));
      results.push(`✅ OK: ${migration.slice(0, 70)}...`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        results.push(`⏭️  SKIP: ${migration.slice(0, 70)}...`);
      } else {
        errors.push(`❌ ERROR: ${migration.slice(0, 70)} => ${msg}`);
      }
    }
  }

  return NextResponse.json({ success: errors.length === 0, results, errors });
}
