
import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  check,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { assessments } from "./assessments";

export const assessmentQuestions = pgTable(
  "assessment_questions",
  {
    id: serial("id").primaryKey(),

    assessmentId: integer("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),

    questionText: text("question_text").notNull(),

    points: integer("points").notNull().default(1),

    position: integer("position").notNull().default(1),

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
      "assessment_questions_points_check",
      sql`${table.points} > 0`,
    ),

    check(
      "assessment_questions_position_check",
      sql`${table.position} > 0`,
    ),

    unique("assessment_questions_position_unique").on(
      table.assessmentId,
      table.position,
    ),

    index("assessment_questions_assessment_id_idx").on(
      table.assessmentId,
    ),
  ],
);
