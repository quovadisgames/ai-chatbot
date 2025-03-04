import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Initialize postgres client with connection string from environment
const connectionString = process.env.POSTGRES_URL;
const client = postgres(connectionString as string, { max: 1 });

// Initialize drizzle with the postgres client
export const db = drizzle(client); 