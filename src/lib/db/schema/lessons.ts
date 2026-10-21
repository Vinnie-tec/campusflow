
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
  unique,
} from "drizzle-orm/pg-core";

import { courses } from "./courses";

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),

    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 200 }).notNull(),

    content: text("content").notNull(),

    position: integer("position").notNull().default(1),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("lessons_position_check", sql`${table.position} > 0`),

    index("lessons_course_id_idx").on(table.courseId),

    unique("lessons_course_position_unique").on(
      table.courseId,
      table.position,
    ),
  ],
);
