import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Initialize postgres client with connection string from environment
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL is not defined in the environment variables');
}

// Use a single connection in production and multiple connections in development
const client = postgres(connectionString, { 
  max: process.env.NODE_ENV === 'production' ? 1 : 10 
});

// Initialize drizzle with the postgres client
export const db = drizzle(client); 