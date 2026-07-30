import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const res = await pool.query(`DELETE FROM "plans" WHERE "name" NOT IN ('Teste 123', 'Básico') RETURNING *`);
    console.log(`Deleted ${res.rowCount} extra plans.`);
  } catch (e: any) { 
    console.log(e.message); 
  }
  process.exit(0);
}

run();
