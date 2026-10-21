
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { lessons } from "./lessons";

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: serial("id").primaryKey(),

    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("lesson_progress_student_lesson_unique").on(
      table.studentId,
      table.lessonId,
    ),

    index("lesson_progress_student_id_idx").on(
      table.studentId,
    ),

    index("lesson_progress_lesson_id_idx").on(
      table.lessonId,
    ),
  ],
);
