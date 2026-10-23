
import {
  pgTable,
  serial,
  integer,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { assessmentAttempts } from "./assessment-attempts";
import { assessmentQuestions } from "./assessment-questions";
import { assessmentOptions } from "./assessment-options";

export const assessmentAnswers = pgTable(
  "assessment_answers",
  {
    id: serial("id").primaryKey(),

    attemptId: integer("attempt_id")
      .notNull()
      .references(() => assessmentAttempts.id, {
        onDelete: "cascade",
      }),

    questionId: integer("question_id")
      .notNull()
      .references(() => assessmentQuestions.id, {
        onDelete: "cascade",
      }),

    selectedOptionId: integer("selected_option_id")
      .notNull()
      .references(() => assessmentOptions.id, {
        onDelete: "restrict",
      }),

    answeredAt: timestamp("answered_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("assessment_answers_attempt_question_unique").on(
      table.attemptId,
      table.questionId,
    ),

    index("assessment_answers_attempt_id_idx").on(table.attemptId),
  ],
);
