import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get the database URL from environment variables
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/todos';

// Create the connection
const client = postgres(connectionString);

// Create the drizzle instance
export const db = drizzle(client, { schema });
