import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  check,
} from "drizzle-orm/pg-core";

// -------------------------------------------------------------
// PROJECTS TABLE
// -------------------------------------------------------------
// This describes the structure Drizzle should create in PostgreSQL.
// Defining this file does NOT create the table by itself.
// We'll create a migration and apply it in a later step.
export const projects = pgTable(
  "projects",
  {
    // Primary key: a unique identifier for each project.
    // PostgreSQL automatically generates the next integer value.
    id: serial("id").primaryKey(),

    // Project name: required, with a maximum length of 150 characters.
    name: varchar("name", { length: 150 }).notNull(),

    // Description: optional text with no small fixed length limit.
    description: text("description"),

    // Project status: required, defaults to "planned".
    // We'll introduce stricter status constraints as we develop.
    status: varchar("status", { length: 30 }).notNull().default("planned"),

    // Timestamp showing when the row was created.
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    // Timestamp showing when the row was last updated.
    // We'll add application logic to update this when necessary.
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "projects_status_check",
      sql`${table.status} IN ('planned', 'in-progress', 'completed')`,
    ),
  ],
);
