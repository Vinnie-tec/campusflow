
import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// -------------------------------------------------------------
// 1. Read the database connection string from the environment.
// -------------------------------------------------------------
// Never hardcode your database password in application code.
// Next.js loads .env.local automatically during local development.
const connectionString = process.env.DATABASE_URL;

// Fail early if the required environment variable is missing.
// This makes configuration problems easier to identify.
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Check your .env.local file.",
  );
}

// -------------------------------------------------------------
// 2. Create the Neon SQL client.
// -------------------------------------------------------------
// The Neon client communicates with the hosted PostgreSQL
// database using Neon's HTTP-based serverless driver.
const sql = neon(connectionString);

// -------------------------------------------------------------
// 3. Initialize Drizzle ORM.
// -------------------------------------------------------------
// Drizzle uses the Neon client to execute typed database queries.
// We will import this shared instance wherever server-side
// database access is required.
const db = drizzle({ client: sql });

// Export the database instance for server-side modules.
export default db;
