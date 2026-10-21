import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { updateCourseStatusSchema } from "@/lib/validations/course-status";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Verify the user's session.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json(
      { error: "You must be logged in." },
      { status: 401 },
    );
  }

  // 2. Only instructors can change course status.
  if (session.user.role !== "instructor") {
    return Response.json(
      { error: "Only instructors can update courses." },
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

  // 4. Parse the submitted JSON.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  // 5. Validate the requested status.
  const result = updateCourseStatusSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: "Invalid course status.",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 6. Update only a course owned by this instructor.
  try {
    const [updatedCourse] = await db
      .update(courses)
      .set({
        status: result.data.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(courses.id, courseId),
          eq(courses.instructorId, session.user.id),
        ),
      )
      .returning();

    if (!updatedCourse) {
      return Response.json(
        { error: "Course not found." },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Course status updated successfully.",
      course: updatedCourse,
    });
  } catch {
    return Response.json(
      { error: "Unable to update the course." },
      { status: 500 },
    );
  }
}
