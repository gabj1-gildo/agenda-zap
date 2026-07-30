import { Pool } from 'pg';
import 'dotenv/config';

async function clear() {
  const parsed = new URL(process.env.DATABASE_URL!);
  const pool = new Pool({
    host: parsed.hostname,
    port: Number(parsed.port),
    user: parsed.username,
    password: String(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });
  
  await pool.query(`TRUNCATE TABLE clients CASCADE;`);
  console.log('Cleared');
  process.exit(0);
}
clear();
