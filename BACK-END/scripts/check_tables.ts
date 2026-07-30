import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log("=== TABELAS NO BANCO DE DADOS ===");
    const rows = (result as any).rows || result;
    for (const r of rows) {
      console.log(r.table_name || r.name || Object.values(r)[0]);
    }
    console.log("================================");
  } catch (error) {
    console.error("Erro ao consultar banco:", error);
  } finally {
    process.exit(0);
  }
}

run();
