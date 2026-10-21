
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { lessons } from "@/lib/db/schema/lessons";
import { createLessonSchema } from "@/lib/validations/lesson";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate the requester.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json(
      { error: "You must be logged in." },
      { status: 401 },
    );
  }

  // 2. Only instructors may create lessons.
  if (session.user.role !== "instructor") {
    return Response.json(
      { error: "Only instructors can create lessons." },
      { status: 403 },
    );
  }

  // 3. Validate the course ID from the URL.
  const { id } = await params;
  const courseId = Number(id);

  if (!Number.isSafeInteger(courseId) || courseId < 1) {
    return Response.json(
      { error: "Invalid course ID." },
      { status: 400 },
    );
  }

  // 4. Parse the incoming JSON safely.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  // 5. Validate the lesson fields.
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

  try {
    // 6. Confirm that this instructor owns the course.
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

    // 7. Insert the lesson into the database.
    const [lesson] = await db
      .insert(lessons)
      .values({
        courseId,
        title: result.data.title,
        content: result.data.content,
        position: result.data.position,
      })
      .returning();

    return Response.json(
      {
        message: "Lesson created successfully.",
        lesson,
      },
      { status: 201 },
    );
  } catch (error) {
    // PostgreSQL unique constraint violation.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return Response.json(
        {
          error: "A lesson already exists at this position in the course.",
        },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Unable to create the lesson." },
      { status: 500 },
    );
  }
}
