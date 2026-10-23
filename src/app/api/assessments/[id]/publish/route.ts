import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { assessments } from "@/lib/db/schema/assessments";
import { assessmentQuestions } from "@/lib/db/schema/assessment-questions";
import { courses } from "@/lib/db/schema/courses";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext
) {
  try {
    // 1. Authenticate the instructor.
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { message: "You must sign in first." },
        { status: 401 }
      );
    }

    if (session.user.role !== "instructor") {
      return NextResponse.json(
        { message: "Only instructors can publish assessments." },
        { status: 403 }
      );
    }

    // 2. Validate the assessment ID.
    const { id } = await params;
    const assessmentId = Number(id);

    if (
      !/^[1-9]\d*$/.test(id) ||
      !Number.isSafeInteger(assessmentId)
    ) {
      return NextResponse.json(
        { message: "Invalid assessment ID." },
        { status: 400 }
      );
    }

    // 3. Find the assessment and its owning instructor.
    const [assessment] = await db
      .select({
        id: assessments.id,
        status: assessments.status,
        instructorId: courses.instructorId,
      })
      .from(assessments)
      .innerJoin(
        courses,
        eq(assessments.courseId, courses.id)
      )
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found." },
        { status: 404 }
      );
    }

    // 4. Never trust the client to establish ownership.
    if (assessment.instructorId !== session.user.id) {
      return NextResponse.json(
        { message: "You do not own this assessment." },
        { status: 403 }
      );
    }

    if (assessment.status !== "draft") {
      return NextResponse.json(
        { message: "This assessment is already published." },
        { status: 409 }
      );
    }

    // 5. An assessment must contain questions before publishing.
    const [questionCount] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(assessmentQuestions)
      .where(
        eq(assessmentQuestions.assessmentId, assessmentId)
      );

    if (Number(questionCount.count) === 0) {
      return NextResponse.json(
        { message: "Add at least one question before publishing." },
        { status: 400 }
      );
    }

    // 6. Change the status only if it is still a draft.
    const [published] = await db
      .update(assessments)
      .set({
        status: "published",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assessments.id, assessmentId),
          eq(assessments.status, "draft")
        )
      )
      .returning({
        id: assessments.id,
        title: assessments.title,
        status: assessments.status,
      });

    if (!published) {
      return NextResponse.json(
        { message: "The assessment could not be published. Refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Assessment published successfully.",
      assessment: published,
    });
  } catch (error) {
    console.error("Publish assessment error:", error);

    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}