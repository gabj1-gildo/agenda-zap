import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function run() {
  try {
    const res = await db.execute(sql`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);
    const rows = (res as any).rows || res;
    
    let currentTable = '';
    let output = '';
    
    for (const r of rows) {
      if (r.table_name !== currentTable) {
        currentTable = r.table_name;
        output += `\n=== TABLE: ${currentTable} ===\n`;
      }
      output += `- ${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable}, Default: ${r.column_default})\n`;
    }
    
    const outputPath = path.join(__dirname, 'db_introspection.txt');
    fs.writeFileSync(outputPath, output);
    console.log('Introspecção concluída! Escrito em db_introspection.txt');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}
run();
