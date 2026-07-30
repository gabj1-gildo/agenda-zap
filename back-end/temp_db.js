const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS ai_models (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider VARCHAR(50) NOT NULL,
      model_id VARCHAR(100) NOT NULL,
      name VARCHAR(150) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('ai_models created');
  process.exit(0);
}

run().catch(console.error);
