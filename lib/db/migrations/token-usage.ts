import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// This migration adds the TokenUsage table to track token usage for AI models
export async function runMigration() {
  // biome-ignore lint: Forbidden non-null assertion.
  const connectionString = process.env.POSTGRES_URL!;
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Running token usage migration...');

  try {
    // Create the TokenUsage table
    await sql`
      CREATE TABLE IF NOT EXISTS "TokenUsage" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "userId" UUID NOT NULL REFERENCES "User"("id"),
        "chatId" UUID REFERENCES "Chat"("id"),
        "messageId" UUID REFERENCES "Message"("id"),
        "model" VARCHAR(64) NOT NULL,
        "promptTokens" INTEGER NOT NULL,
        "completionTokens" INTEGER NOT NULL,
        "totalTokens" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL
      );
    `;

    console.log('Token usage migration completed successfully');
  } catch (error) {
    console.error('Error during token usage migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
} 