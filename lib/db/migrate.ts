import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Check if we should use mock data
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

async function main() {
  if (USE_MOCK_DB) {
    console.log('Using mock database, skipping migrations');
    return;
  }

  console.log('⏳ Running migrations...');

  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ POSTGRES_URL is not defined');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('✅ Migrations completed');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed', error);
    await sql.end();
    process.exit(1);
  }
}

main();
