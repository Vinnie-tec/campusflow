
import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  check,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { courses } from "./courses";
import { user } from "./auth";

export const courseReviews = pgTable(
  "course_reviews",
  {
    id: serial("id").primaryKey(),

    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),

    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    rating: integer("rating").notNull(),

    comment: text("comment"),

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
      "course_reviews_rating_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),

    unique("course_reviews_course_student_unique").on(
      table.courseId,
      table.studentId,
    ),

    index("course_reviews_course_id_idx").on(table.courseId),
  ],
);
