const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:password@localhost:5432/agenda_zap' });
async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE users_admin DROP COLUMN IF EXISTS payment_gateway');
    await client.query('ALTER TABLE users_admin DROP COLUMN IF EXISTS mp_access_token');
    await client.query('ALTER TABLE users_admin DROP COLUMN IF EXISTS abacatepay_token');
    await client.query('ALTER TABLE users_admin ADD COLUMN IF NOT EXISTS accept_payment_on_site boolean DEFAULT true');
    await client.query('ALTER TABLE users_admin ADD COLUMN IF NOT EXISTS google_calendar_token text');
    
    await client.query(`CREATE TABLE IF NOT EXISTS payment_keys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES users_admin(id),
      name varchar(255) NOT NULL,
      gateway varchar(50) NOT NULL,
      token text NOT NULL,
      is_active boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )`);
    console.log('Migrated successfully');
  } catch (e) { console.error(e); }
  await client.end();
}
run();
