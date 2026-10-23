
import "server-only";

import { desc, eq } from "drizzle-orm";

import db from "@/lib/db";
import { courseReviews } from "@/lib/db/schema/course-reviews";
import { user } from "@/lib/db/schema/auth";

export async function getCourseReviews(courseId: number) {
  if (!Number.isSafeInteger(courseId) || courseId <= 0) {
    throw new Error("A valid course ID is required.");
  }

  return db
    .select({
      id: courseReviews.id,
      rating: courseReviews.rating,
      comment: courseReviews.comment,
      createdAt: courseReviews.createdAt,
      studentName: user.name,
    })
    .from(courseReviews)
    .innerJoin(user, eq(courseReviews.studentId, user.id))
    .where(eq(courseReviews.courseId, courseId))
    .orderBy(desc(courseReviews.createdAt));
}
