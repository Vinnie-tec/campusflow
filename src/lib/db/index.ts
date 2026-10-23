
import "server-only";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// Read the connection string from .env.local.
// Never hardcode database credentials in source code.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Check your .env.local file.",
  );
}

// Create a PostgreSQL connection pool.
// A pool manages reusable database connections instead of
// opening a brand-new connection for every query.
const pool = new Pool({
  connectionString,
});

// Initialize Drizzle using the node-postgres driver.
// Unlike the Neon HTTP driver, this driver supports transactions.
const db = drizzle(pool);

// Export the shared database instance for server-side code.
export default db;
