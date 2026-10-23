import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { courses } from "@/lib/db/schema/courses";
import { courseReviews } from "@/lib/db/schema/course-reviews";
import { enrollments } from "@/lib/db/schema/enrollments";
import { user } from "@/lib/db/schema/auth";
import { createCourseReviewSchema } from "@/lib/validations/course-review";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseCourseId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// GET /api/courses/:id/reviews
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const courseId = parseCourseId(id);

    if (courseId === null) {
      return NextResponse.json(
        { message: "Invalid course ID." },
        { status: 400 },
      );
    }

    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, "published")))
      .limit(1);

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 },
      );
    }

    const reviews = await db
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

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch course reviews:", error);

    return NextResponse.json(
      { message: "Unable to load reviews." },
      { status: 500 },
    );
  }
}

// POST /api/courses/:id/reviews
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { message: "You must be signed in to review a course." },
        { status: 401 },
      );
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Only students can review courses." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const courseId = parseCourseId(id);

    if (courseId === null) {
      return NextResponse.json(
        { message: "Invalid course ID." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const validation = createCourseReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid review data.",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, "published")))
      .limit(1);

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 },
      );
    }

    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.studentId, session.user.id),
        ),
      )
      .limit(1);

    if (!enrollment) {
      return NextResponse.json(
        { message: "You must be enrolled to review this course." },
        { status: 403 },
      );
    }

    const [review] = await db
      .insert(courseReviews)
      .values({
        courseId,
        studentId: session.user.id,
        rating: validation.data.rating,
        comment: validation.data.comment ?? null,
      })
      .onConflictDoNothing({
        target: [courseReviews.courseId, courseReviews.studentId],
      })
      .returning({
        id: courseReviews.id,
        rating: courseReviews.rating,
        comment: courseReviews.comment,
        createdAt: courseReviews.createdAt,
      });

    if (!review) {
      return NextResponse.json(
        { message: "You have already reviewed this course." },
        { status: 409 },
      );
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Failed to create course review:", error);

    return NextResponse.json(
      { message: "Unable to submit your review." },
      { status: 500 },
    );
  }
}
