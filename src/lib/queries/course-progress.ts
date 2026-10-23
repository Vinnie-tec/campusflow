import { and, eq, sql } from "drizzle-orm";

import db from "@/lib/db";
import { lessons } from "@/lib/db/schema/lessons";
import { lessonProgress } from "@/lib/db/schema/lesson-progress";
import { calculatePercentage } from "@/lib/utils/percentage";

export async function getCourseProgress(courseId: number, studentId: string) {
  if (!Number.isSafeInteger(courseId) || courseId <= 0) {
    throw new Error("Invalid course ID.");
  }

  if (!studentId.trim()) {
    throw new Error("Invalid student ID.");
  }

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

  const percentage = calculatePercentage(completedLessons, totalLessons);

  return {
    totalLessons,
    completedLessons,
    percentage,
  };
}
