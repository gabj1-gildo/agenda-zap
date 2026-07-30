import { env } from '@/config/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL?.includes('supabase.com') ||
       env.DATABASE_URL?.includes('pooler.supabase')
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool, { schema });
