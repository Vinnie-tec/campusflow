
import "server-only";

import { eq, sql } from "drizzle-orm";

import db from "@/lib/db";
import { courseReviews } from "@/lib/db/schema/course-reviews";

export async function getCourseReviewSummary(courseId: number) {
  const [summary] = await db
    .select({
      averageRating: sql<number>`
        coalesce(avg(${courseReviews.rating}), 0)::float
      `,
      totalReviews: sql<number>`
        count(*)::int
      `,
    })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId));

  return {
    averageRating: Number(summary.averageRating),
    totalReviews: summary.totalReviews,
  };
}
