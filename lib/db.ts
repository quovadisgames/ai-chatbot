import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from './db/schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined');
}

export const db = drizzle(sql, { schema }); 