
import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  check,
  index,
} from "drizzle-orm/pg-core";

import { courses } from "./courses";

export const assessments = pgTable(
  "assessments",
  {
    id: serial("id").primaryKey(),

    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 200 }).notNull(),

    instructions: text("instructions"),

    passingScore: integer("passing_score").notNull().default(50),

    status: varchar("status", { length: 20 })
      .notNull()
      .default("draft"),

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
      "assessments_passing_score_check",
      sql`${table.passingScore} >= 0 AND ${table.passingScore} <= 100`,
    ),

    check(
      "assessments_status_check",
      sql`${table.status} IN ('draft', 'published')`,
    ),

    index("assessments_course_id_idx").on(table.courseId),
  ],
);
