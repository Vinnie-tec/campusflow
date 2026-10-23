
import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  check,
  index,
} from "drizzle-orm/pg-core";

import { assessments } from "./assessments";
import { user } from "./auth";

export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: serial("id").primaryKey(),

    assessmentId: integer("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),

    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    score: integer("score"),

    status: text("status").notNull().default("in_progress"),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    check(
      "assessment_attempts_score_check",
      sql`${table.score} IS NULL OR ${table.score} >= 0`,
    ),

    check(
      "assessment_attempts_status_check",
      sql`${table.status} IN ('in_progress', 'submitted', 'graded')`,
    ),

    index("assessment_attempts_assessment_student_idx").on(
      table.assessmentId,
      table.studentId,
    ),
  ],
);
