import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '@/lib/env';
import { join } from 'path';

const main = async () => {
  try {
    if (process.env.USE_MOCK_DB === 'true') {
      console.log('Using mock database, skipping migrations');
      return;
    }

    if (!env.POSTGRES_URL) {
      console.log('No database URL provided, skipping migrations');
      return;
    }

    console.log('⏳ Running migrations...');

    const sql = postgres(env.POSTGRES_URL, { max: 1 });
    const db = drizzle(sql);

    try {
      const migrationsFolder = join(process.cwd(), 'drizzle');
      await migrate(db, { migrationsFolder });
      console.log('✅ Migrations completed');
    } catch (error: any) {
      if (error.code === 'ENOENT' || (error.message && error.message.includes("Can't find meta/_journal.json"))) {
        console.log('No migrations found or migrations folder missing, skipping...');
        return;
      }
      throw error;
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Migration failed', error);
    // Don't exit with error code since we want the build to continue
    console.log('Continuing with build despite migration failure');
  }
};

main();
