
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load variables from .env.local for local CLI commands.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  // Where Drizzle reads your TypeScript table definitions.
  schema: "./src/lib/db/schema/*",

  // Where generated SQL migrations are stored.
  out: "./drizzle",

  // We are using PostgreSQL hosted by Neon.
  dialect: "postgresql",

  // Use the direct Neon connection for migrations.
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "",
  },
});
