import { Pool } from 'pg';
import 'dotenv/config';

async function fix() {
  const parsed = new URL(process.env.DATABASE_URL!);
  const pool = new Pool({
    host: parsed.hostname,
    port: Number(parsed.port),
    user: parsed.username,
    password: String(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await pool.query(`ALTER TABLE tenants ADD CONSTRAINT tenants_phone_unique UNIQUE (phone);`);
    console.log('Fixed');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
fix();
