
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { enrollments } from "@/lib/db/schema/enrollments";
import { lessons } from "@/lib/db/schema/lessons";
import { lessonProgress } from "@/lib/db/schema/lesson-progress";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; lessonId: string }>;
  },
) {
  try {
    // 1. Authenticate the user.
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    // 2. Only students can mark lessons complete.
    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can update lesson progress." },
        { status: 403 },
      );
    }

    // 3. Validate the IDs from the URL.
    const { id, lessonId } = await params;
    
    const courseId = Number(id);
    const parsedLessonId = Number(lessonId);

    if (
      !Number.isSafeInteger(courseId) ||
      courseId < 1 ||
      !Number.isSafeInteger(parsedLessonId) ||
      parsedLessonId < 1
    ) {
      return NextResponse.json(
        { error: "Invalid course or lesson ID." },
        { status: 400 },
      );
    }

    // 4. Confirm that the lesson belongs to a published course.
    const [lesson] = await db
      .select({
        id: lessons.id,
      })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(
        and(
          eq(lessons.id, parsedLessonId),
          eq(lessons.courseId, courseId),
          eq(courses.status, "published"),
        ),
      )
      .limit(1);

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found." },
        { status: 404 },
      );
    }

    // 5. Confirm that the student is enrolled in this course.
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, session.user.id),
          eq(enrollments.courseId, courseId),
        ),
      )
      .limit(1);

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must enroll in this course first." },
        { status: 403 },
      );
    }

    // 6. Record completion without creating duplicates.
    const [progress] = await db
      .insert(lessonProgress)
      .values({
        studentId: session.user.id,
        lessonId: parsedLessonId,
      })
      .onConflictDoNothing({
        target: [
          lessonProgress.studentId,
          lessonProgress.lessonId,
        ],
      })
      .returning();

    // A previous completion is still a successful final state.
    if (!progress) {
      return NextResponse.json(
        { message: "Lesson already completed." },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        message: "Lesson marked as completed.",
        progress,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Lesson progress error:", error);

    return NextResponse.json(
      { error: "Unable to update lesson progress." },
      { status: 500 },
    );
  }
}
