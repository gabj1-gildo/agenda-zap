import { Pool } from 'pg';
import 'dotenv/config';

async function migrate() {
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
    await pool.query(`UPDATE users SET role = 'ADMIN' WHERE role = 'TENANT';`);
    console.log('Roles migrated successfully.');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
migrate();
