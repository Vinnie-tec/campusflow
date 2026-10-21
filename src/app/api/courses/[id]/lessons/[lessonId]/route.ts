
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { lessons } from "@/lib/db/schema/lessons";
import { createLessonSchema } from "@/lib/validations/lesson";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  // 1. Authenticate the requester.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json(
      { error: "You must be logged in to edit a lesson." },
      { status: 401 },
    );
  }

  // 2. Only instructors can edit lessons.
  if (session.user.role !== "instructor") {
    return Response.json(
      { error: "Only instructors can edit lessons." },
      { status: 403 },
    );
  }

  // 3. Extract and validate the route parameters.
  const { id, lessonId } = await params;
  
  const courseId = Number(id);
  const parsedLessonId = Number(lessonId);

  if (
    !Number.isSafeInteger(courseId) ||
    courseId < 1 ||
    !Number.isSafeInteger(parsedLessonId) ||
    parsedLessonId < 1
  ) {
    return Response.json(
      { error: "Invalid course or lesson ID." },
      { status: 400 },
    );
  }

  // 4. Parse the submitted JSON safely.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  // 5. Validate the updated lesson information.
  const result = createLessonSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: "Invalid lesson information.",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 6. Confirm the instructor owns this course.
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.id, courseId),
        eq(courses.instructorId, session.user.id),
      ),
    )
    .limit(1);

  if (!course) {
    return Response.json(
      { error: "Course not found." },
      { status: 404 },
    );
  }

  // 7. Update only the lesson belonging to this course.
  try {
    const [updatedLesson] = await db
      .update(lessons)
      .set({
        title: result.data.title,
        content: result.data.content,
        position: result.data.position,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(lessons.id, parsedLessonId),
          eq(lessons.courseId, courseId),
        ),
      )
      .returning();

    if (!updatedLesson) {
      return Response.json(
        { error: "Lesson not found in this course." },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Lesson updated successfully.",
      lesson: updatedLesson,
    });
  } catch (error: unknown) {
    // PostgreSQL code 23505 means a unique constraint was violated.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return Response.json(
        {
          error: "Another lesson already uses this position.",
        },
        { status: 409 },
      );
    }

    console.error("Failed to update lesson:", error);

    return Response.json(
      { error: "Unable to update lesson. Please try again." },
      { status: 500 },
    );
  }
}
