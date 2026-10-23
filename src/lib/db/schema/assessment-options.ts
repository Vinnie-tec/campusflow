
import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  check,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { assessmentQuestions } from "./assessment-questions";

export const assessmentOptions = pgTable(
  "assessment_options",
  {
    id: serial("id").primaryKey(),

    questionId: integer("question_id")
      .notNull()
      .references(() => assessmentQuestions.id, {
        onDelete: "cascade",
      }),

    optionText: text("option_text").notNull(),

    isCorrect: boolean("is_correct").notNull().default(false),

    position: integer("position").notNull().default(1),
  },
  (table) => [
    check(
      "assessment_options_position_check",
      sql`${table.position} > 0`,
    ),

    unique("assessment_options_position_unique").on(
      table.questionId,
      table.position,
    ),

    index("assessment_options_question_id_idx").on(
      table.questionId,
    ),
  ],
);
