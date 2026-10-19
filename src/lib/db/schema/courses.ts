import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  check,
  index,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const courses = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),

    title: varchar("title", { length: 200 }).notNull(),

    description: text("description"),

    status: varchar("status", { length: 20 })
      .notNull()
      .default("draft"),

    instructorId: text("instructor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "courses_status_check",
      sql`${table.status} IN ('draft', 'published')`,
    ),
    index("courses_instructor_id_idx").on(table.instructorId),
  ],
);