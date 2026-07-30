import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS "plan_features" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(255) NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`);
    console.log('Created plan_features');
  } catch (e: any) { console.log(e.message); }

  try {
    await pool.query(`ALTER TABLE "plans" ADD COLUMN "trial_days" integer DEFAULT 0 NOT NULL;`);
    console.log('Added trial_days');
  } catch (e: any) { console.log(e.message); }

  try {
    await pool.query(`ALTER TABLE "invoices" ADD COLUMN "type" varchar(50) DEFAULT 'OVERAGE' NOT NULL;`);
    console.log('Added type');
  } catch (e: any) { console.log(e.message); }

  try {
    await pool.query(`ALTER TABLE "invoices" ADD COLUMN "plan_id" uuid;`);
    console.log('Added plan_id');
  } catch (e: any) { console.log(e.message); }

  try {
    await pool.query(`ALTER TABLE "user_subscriptions" ADD COLUMN "trial_end" timestamp;`);
    console.log('Added trial_end to user_subscriptions');
  } catch (e: any) { console.log(e.message); }
  
  process.exit(0);
}

run();
