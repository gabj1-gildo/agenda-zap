import 'dotenv/config';
import { sql } from "drizzle-orm";
import { db } from "./index";

async function runPatch() {
  console.log('Running automations patch...');
  try {
    // Add columns
    await db.execute(sql`ALTER TABLE automations ADD COLUMN name varchar(255) DEFAULT 'Automação' NOT NULL`);
    await db.execute(sql`ALTER TABLE automations ADD COLUMN target_type varchar(50) DEFAULT 'CLIENT' NOT NULL`);
    await db.execute(sql`ALTER TABLE automations ADD COLUMN target_value varchar(255)`);
    
    // Alter clientId to be nullable
    await db.execute(sql`ALTER TABLE automations ALTER COLUMN client_id DROP NOT NULL`);

    console.log('Patch aplicado com sucesso!');
  } catch (error: any) {
    if (error.code === '42701') {
      console.log('Columns already exist.');
    } else {
      console.error('Erro ao aplicar patch:', error);
    }
  }
  process.exit(0);
}

runPatch();
