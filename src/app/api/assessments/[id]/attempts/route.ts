
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { assessments } from "@/lib/db/schema/assessments";
import { assessmentAttempts } from "@/lib/db/schema/assessment-attempts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  // 1. Require an authenticated user.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "You must be logged in to start an assessment." },
      { status: 401 },
    );
  }

  // 2. Only students can start student attempts.
  if (session.user.role !== "student") {
    return NextResponse.json(
      { error: "Only students can take assessments." },
      { status: 403 },
    );
  }

  // 3. Validate the assessment ID from the URL.
  const { id } = await params;
  const assessmentId = Number(id);

  if (!Number.isSafeInteger(assessmentId) || assessmentId <= 0) {
    return NextResponse.json(
      { error: "Invalid assessment ID." },
      { status: 400 },
    );
  }

  try {
    // 4. The assessment must exist and be published.
    const [assessment] = await db
      .select({
        id: assessments.id,
        courseId: assessments.courseId,
        status: assessments.status,
      })
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (!assessment || assessment.status !== "published") {
      return NextResponse.json(
        { error: "This assessment is unavailable." },
        { status: 404 },
      );
    }

    // 5. Create an attempt for the logged-in student.
    const [attempt] = await db
      .insert(assessmentAttempts)
      .values({
        assessmentId: assessment.id,
        studentId: session.user.id,
        status: "in_progress",
      })
      .returning({
        id: assessmentAttempts.id,
        assessmentId: assessmentAttempts.assessmentId,
        status: assessmentAttempts.status,
        startedAt: assessmentAttempts.startedAt,
      });

    return NextResponse.json(
      {
        message: "Assessment attempt started.",
        attempt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to start assessment attempt:", error);

    return NextResponse.json(
      { error: "Could not start the assessment. Please try again." },
      { status: 500 },
    );
  }
}
