
import { and, eq, sql } from "drizzle-orm";

import db from "@/lib/db";
import { lessons } from "@/lib/db/schema/lessons";
import { lessonProgress } from "@/lib/db/schema/lesson-progress";

export async function getCourseProgress(
  courseId: number,
  studentId: string,
) {
  const [result] = await db
    .select({
      totalLessons: sql<number>`count(${lessons.id})::int`,
      completedLessons: sql<number>`count(${lessonProgress.id})::int`,
    })
    .from(lessons)
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.studentId, studentId),
      ),
    )
    .where(eq(lessons.courseId, courseId));

  const totalLessons = result.totalLessons;
  const completedLessons = result.completedLessons;

  const percentage =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    percentage,
  };
}
