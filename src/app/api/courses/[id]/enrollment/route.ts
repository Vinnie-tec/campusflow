
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { enrollments } from "@/lib/db/schema/enrollments";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Check whether the user is logged in
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to enroll." },
        { status: 401 },
      );
    }

    // 2. Only students can enroll
    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can enroll in courses." },
        { status: 403 },
      );
    }
   
    // 3. Get and validate the course ID from the URL.
    const { id } = await params;

    // Only accept a positive decimal ID in string form.
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid course ID." },
        { status: 400 },
      );
    }

    const courseId = Number(id);

    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return NextResponse.json(
        { error: "Invalid course ID." },
        { status: 400 },
      );
    }


    // 4. Make sure the course exists and is published
    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(
        and(
          eq(courses.id, courseId),
          eq(courses.status, "published"),
        ),
      )
      .limit(1);

    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 },
      );
    }

    // 5. Check whether the student is already enrolled
    const [existingEnrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, session.user.id),
          eq(enrollments.courseId, courseId),
        ),
      )
      .limit(1);

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this course." },
        { status: 409 },
      );
    }

    // 6. Create the enrollment
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        studentId: session.user.id,
        courseId,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Successfully enrolled in course.",
        enrollment,
      },
      { status: 201 },
    );
  } catch (error) {
    // A unique constraint violation can occur if two requests
    // attempt to enroll the same student at almost the same time.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "You are already enrolled in this course." },
        { status: 409 },
      );
    }

    console.error("Course enrollment error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while enrolling." },
      { status: 500 },
    );
  }
}
