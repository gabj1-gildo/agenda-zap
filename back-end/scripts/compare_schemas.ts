import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function run() {
  const tables = ['audit_logs', 'client_plans', 'automations'];
  for (const table of tables) {
    const res = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = ${table}
      ORDER BY ordinal_position;
    `);
    const rows = (res as any).rows || res;
    console.log(`\n=== TABLE: ${table} ===`);
    for (const r of rows) {
      console.log(`- ${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable}, Default: ${r.column_default})`);
    }
  }
  process.exit(0);
}
run();
