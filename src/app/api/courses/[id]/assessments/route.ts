
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { assessments } from "@/lib/db/schema/assessments";
import { createAssessmentSchema } from "@/lib/validations/assessment";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// GET /api/courses/:id/assessments
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const courseId = parseId(id);

    if (!courseId) {
      return NextResponse.json(
        { message: "Invalid course ID." },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const [course] = await db
      .select({
        id: courses.id,
        instructorId: courses.instructorId,
        status: courses.status,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 },
      );
    }

    const isOwner =
      session?.user.role === "instructor" &&
      session.user.id === course.instructorId;

    // Instructors can manage their own assessments.
    // Other users only see published assessments in published courses.
    if (!isOwner && course.status !== "published") {
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 },
      );
    }

    const results = await db
      .select({
        id: assessments.id,
        title: assessments.title,
        instructions: assessments.instructions,
        passingScore: assessments.passingScore,
        status: assessments.status,
        createdAt: assessments.createdAt,
      })
      .from(assessments)
      .where(
        isOwner
          ? eq(assessments.courseId, courseId)
          : and(
              eq(assessments.courseId, courseId),
              eq(assessments.status, "published"),
            ),
      )
      .orderBy(desc(assessments.createdAt));

    return NextResponse.json({ assessments: results });
  } catch (error) {
    console.error("Failed to fetch assessments:", error);

    return NextResponse.json(
      { message: "Unable to load assessments." },
      { status: 500 },
    );
  }
}

// POST /api/courses/:id/assessments
export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { message: "You must sign in first." },
        { status: 401 },
      );
    }

    if (session.user.role !== "instructor") {
      return NextResponse.json(
        { message: "Only instructors can create assessments." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const courseId = parseId(id);

    if (!courseId) {
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

    const validation = createAssessmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid assessment data.",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Authorization: the instructor must own this course.
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
      return NextResponse.json(
        { message: "Course not found." },
        { status: 404 },
      );
    }

    const [assessment] = await db
      .insert(assessments)
      .values({
        courseId,
        title: validation.data.title,
        instructions: validation.data.instructions ?? null,
        passingScore: validation.data.passingScore,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create assessment:", error);

    return NextResponse.json(
      { message: "Unable to create assessment." },
      { status: 500 },
    );
  }
}
