
import { and, asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { assessments } from "@/lib/db/schema/assessments";
import { assessmentQuestions } from "@/lib/db/schema/assessment-questions";
import { assessmentOptions } from "@/lib/db/schema/assessment-options";
import { courses } from "@/lib/db/schema/courses";
import { createAssessmentQuestionSchema } from "@/lib/validations/assessment-question";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// GET /api/assessments/:id/questions
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const assessmentId = parseId(id);

    if (assessmentId === null) {
      return NextResponse.json(
        { message: "Invalid assessment ID." },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const [assessment] = await db
      .select({
        id: assessments.id,
        status: assessments.status,
        courseStatus: courses.status,
        instructorId: courses.instructorId,
      })
      .from(assessments)
      .innerJoin(courses, eq(assessments.courseId, courses.id))
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found." },
        { status: 404 },
      );
    }

    const isOwner =
      session?.user.role === "instructor" &&
      session.user.id === assessment.instructorId;

    if (
      !isOwner &&
      (assessment.status !== "published" ||
        assessment.courseStatus !== "published")
    ) {
      return NextResponse.json(
        { message: "Assessment not found." },
        { status: 404 },
      );
    }

    const questions = await db
      .select({
        id: assessmentQuestions.id,
        questionText: assessmentQuestions.questionText,
        points: assessmentQuestions.points,
        position: assessmentQuestions.position,
      })
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, assessmentId))
      .orderBy(asc(assessmentQuestions.position));

    const questionIds = questions.map((question) => question.id);

    // Return options without isCorrect. Correct answers must remain private.
    const options = questionIds.length
      ? await db
          .select({
            id: assessmentOptions.id,
            questionId: assessmentOptions.questionId,
            optionText: assessmentOptions.optionText,
            position: assessmentOptions.position,
          })
          .from(assessmentOptions)
          .where(
            sql`${assessmentOptions.questionId} IN ${questionIds}`,
          )
          .orderBy(asc(assessmentOptions.position))
      : [];

    return NextResponse.json({
      questions: questions.map((question) => ({
        ...question,
        options: options.filter(
          (option) => option.questionId === question.id,
        ),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch assessment questions:", error);

    return NextResponse.json(
      { message: "Unable to load questions." },
      { status: 500 },
    );
  }
}

// POST /api/assessments/:id/questions
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
        { message: "Only instructors can add questions." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const assessmentId = parseId(id);

    if (assessmentId === null) {
      return NextResponse.json(
        { message: "Invalid assessment ID." },
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

    const validation = createAssessmentQuestionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid question data.",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [assessment] = await db
      .select({
        id: assessments.id,
        status: assessments.status,
        instructorId: courses.instructorId,
      })
      .from(assessments)
      .innerJoin(courses, eq(assessments.courseId, courses.id))
      .where(
        and(
          eq(assessments.id, assessmentId),
          eq(courses.instructorId, session.user.id),
        ),
      )
      .limit(1);

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found." },
        { status: 404 },
      );
    }

    if (assessment.status !== "draft") {
      return NextResponse.json(
        { message: "Unpublish the assessment before editing it." },
        { status: 409 },
      );
    }

    const { options, ...questionData } = validation.data;

    const [existingPosition] = await db
      .select({
        maxPosition: sql<number>`coalesce(max(${assessmentQuestions.position}), 0)::int`,
      })
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, assessmentId));

    const position =
      questionData.position ?? existingPosition.maxPosition + 1;

    try {
      const createdQuestion = await db.transaction(async (tx) => {
        const [question] = await tx
          .insert(assessmentQuestions)
          .values({
            assessmentId,
            questionText: questionData.questionText,
            points: questionData.points,
            position,
          })
          .returning({
            id: assessmentQuestions.id,
            questionText: assessmentQuestions.questionText,
            points: assessmentQuestions.points,
            position: assessmentQuestions.position,
          });

        const createdOptions = await tx
          .insert(assessmentOptions)
          .values(
            options.map((option, index) => ({
              questionId: question.id,
              optionText: option.optionText,
              isCorrect: option.isCorrect,
              position: index + 1,
            })),
          )
          .returning({
            id: assessmentOptions.id,
            optionText: assessmentOptions.optionText,
            position: assessmentOptions.position,
          });

        return { ...question, options: createdOptions };
      });

      return NextResponse.json(
        { question: createdQuestion },
        { status: 201 },
      );
    } catch (error) {
      // PostgreSQL unique-constraint violation.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        return NextResponse.json(
          { message: "A question already uses that position." },
          { status: 409 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Failed to create assessment question:", error);

    return NextResponse.json(
      { message: "Unable to create question." },
      { status: 500 },
    );
  }
}
