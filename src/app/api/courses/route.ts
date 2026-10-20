
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { createCourseSchema } from "@/lib/validations/course";

export async function POST(request: Request) {
  // 1. Check whether the requester is logged in.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json(
      { error: "You must be logged in to create a course." },
      { status: 401 },
    );
  }

  // 2. Only instructors can create courses.
  if (session.user.role !== "instructor") {
    return Response.json(
      { error: "Only instructors can create courses." },
      { status: 403 },
    );
  }

  // 3. Read the submitted JSON safely.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON request body." }, 
      
      { status: 400 },
    );
  }

  // 4. Validate the submitted course information.
  const result = createCourseSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: "Invalid course information.",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 5. Save the course in PostgreSQL.
  try {
    const [course] = await db
      .insert(courses)
      .values({
        title: result.data.title,
        description: result.data.description ?? null,
        instructorId: session.user.id,
        status: "draft",
      })
      .returning();

    return Response.json(
      {
        message: "Course created successfully.",
        course,
      },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Unable to create the course. Please try again." },
      { status: 500 },
    );
  }
}
