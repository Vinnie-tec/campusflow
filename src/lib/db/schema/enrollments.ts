
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
import { courses } from "./courses";

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),

    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),

    enrolledAt: timestamp("enrolled_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("enrollments_student_course_unique").on(
      table.studentId,
      table.courseId,
    ),

    index("enrollments_student_id_idx").on(table.studentId),

    index("enrollments_course_id_idx").on(table.courseId),
  ],
);
