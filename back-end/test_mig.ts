import { Client } from 'pg';
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;');
    console.log(res.rows);
  } catch (e) {
    console.log('Error:', e);
  }
  process.exit(0);
}
main();
