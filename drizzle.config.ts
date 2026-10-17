
import "dotenv/config";

import { defineConfig } from "drizzle-kit";

// -------------------------------------------------------------
// Drizzle Kit configuration
// -------------------------------------------------------------
// This file tells Drizzle Kit where our schema definitions live,
// where to write migration files, and how to reach PostgreSQL.
export default defineConfig({
  // PostgreSQL schema definitions written in TypeScript.
  schema: "./src/lib/db/schema/*",

  // Directory where generated SQL migrations are stored.
  out: "./drizzle",

  // Tell Drizzle Kit which database dialect we use.
  dialect: "postgresql",

  // Use a direct connection for migration operations when available.
  // Fall back to DATABASE_URL if that URL is already direct.
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "",
  },
});
