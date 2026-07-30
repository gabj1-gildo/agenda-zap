import 'dotenv/config';
import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function reset() {
  console.log('DROP SCHEMA...');
  await db.execute(sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
  console.log('Done');
  process.exit(0);
}
reset().catch((e) => { console.error(e); process.exit(1); });
