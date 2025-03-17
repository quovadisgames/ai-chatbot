import { drizzle } from 'drizzle-orm/vercel-postgres';
import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { sql } from '@vercel/postgres';
import { tokenUsage } from '../schema';

// This script should only be run in development
if (process.env.NODE_ENV === 'production') {
  throw new Error('This script should not be run in production');
}

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined');
}

const db = drizzle(sql);

async function main() {
  console.log('Running token usage migration...');
  
  // Create token_usage table if it doesn't exist
  await db.create(tokenUsage).ifNotExists();
  
  console.log('Token usage migration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Token usage migration failed!');
  console.error(err);
  process.exit(1);
}); 