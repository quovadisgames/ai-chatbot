import { drizzle } from 'drizzle-orm/vercel-postgres';
import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { sql } from '@vercel/postgres';

// This script should only be run in development
if (process.env.NODE_ENV === 'production') {
  throw new Error('This script should not be run in production');
}

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined');
}

const db = drizzle(sql);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
