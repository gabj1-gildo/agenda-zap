import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Adding columns to DB...');
  
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(100) UNIQUE;`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;`);
    await db.execute(sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" text;`);
    await db.execute(sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;`);
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}

main();
