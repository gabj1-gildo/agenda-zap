import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const file = path.join(__dirname, '../drizzle/0000_simple_elektra.sql');
const content = fs.readFileSync(file, 'utf8');
const hash = crypto.createHash('sha256').update(content).digest('hex');

const sql = `
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
VALUES ('${hash}', extract(epoch from now()) * 1000);
`;

console.log(sql);
