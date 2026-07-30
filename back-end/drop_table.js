const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  try {
    await client.query('DROP TABLE IF EXISTS plans CASCADE');
    console.log('Dropped plans');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
