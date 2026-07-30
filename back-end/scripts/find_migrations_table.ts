import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function run() {
  const res = await db.execute(sql`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name = '__drizzle_migrations';
  `);
  const rows = (res as any).rows || res;
  console.log("Migration tables found:", rows);
  process.exit(0);
}
run();
