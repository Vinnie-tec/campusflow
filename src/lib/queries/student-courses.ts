import "server-only";
import { and, desc, eq } from "drizzle-orm";

import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { enrollments } from "@/lib/db/schema/enrollments";

/**
 * Fetch a student's currently published enrolled courses.
 *
 * The studentId must come from the authenticated session,
 * not from an untrusted client request.
 */
export async function getStudentCourses(studentId: string) {
  if (!studentId.trim()) {
    throw new Error("A valid student ID is required.");
  }

  const enrolledCourses = await db
    .select({
      enrollmentId: enrollments.id,
      enrolledAt: enrollments.enrolledAt,
      courseId: courses.id,
      title: courses.title,
      description: courses.description,
      instructorId: courses.instructorId,
      createdAt: courses.createdAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(courses.status, "published"),
      ),
    )
    .orderBy(desc(enrollments.enrolledAt));

  return enrolledCourses;
}
