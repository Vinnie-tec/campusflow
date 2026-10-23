
import { and, asc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { assessments } from "@/lib/db/schema/assessments";
import { assessmentAttempts } from "@/lib/db/schema/assessment-attempts";
import { assessmentQuestions } from "@/lib/db/schema/assessment-questions";
import { assessmentOptions } from "@/lib/db/schema/assessment-options";
import { assessmentAnswers } from "@/lib/db/schema/assessment-answers";

type RouteContext = {
  params: Promise<{
    id: string;
    attemptId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "You must be logged in." },
      { status: 401 },
    );
  }

  if (session.user.role !== "student") {
    return NextResponse.json(
      { error: "Only students can take assessments." },
      { status: 403 },
    );
  }

  const { id, attemptId: attemptIdParam } = await params;

  const assessmentId = Number(id);
  const attemptId = Number(attemptIdParam);

  if (
    !Number.isSafeInteger(assessmentId) ||
    assessmentId <= 0 ||
    !Number.isSafeInteger(attemptId) ||
    attemptId <= 0
  ) {
    return NextResponse.json(
      { error: "Invalid assessment or attempt ID." },
      { status: 400 },
    );
  }

  try {
    // Find an attempt belonging to the signed-in student.
    const [attempt] = await db
      .select({
        id: assessmentAttempts.id,
        assessmentId: assessmentAttempts.assessmentId,
        studentId: assessmentAttempts.studentId,
        status: assessmentAttempts.status,
      })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.id, attemptId),
          eq(assessmentAttempts.assessmentId, assessmentId),
          eq(assessmentAttempts.studentId, session.user.id),
        ),
      )
      .limit(1);

    if (!attempt) {
      return NextResponse.json(
        { error: "Assessment attempt not found." },
        { status: 404 },
      );
    }

    // Only load the quiz for an active attempt.
    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: "This assessment attempt is no longer in progress." },
        { status: 409 },
      );
    }

    const [assessment] = await db
      .select({
        id: assessments.id,
        title: assessments.title,
        instructions: assessments.instructions,
        passingScore: assessments.passingScore,
      })
      .from(assessments)
      .where(
        and(
          eq(assessments.id, assessmentId),
          eq(assessments.status, "published"),
        ),
      )
      .limit(1);

    if (!assessment) {
      return NextResponse.json(
        { error: "This assessment is unavailable." },
        { status: 404 },
      );
    }

    // Load the assessment's questions in display order.
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

    // Load options for all questions in one query.
    // Do not select isCorrect: students must not receive the answer key.
    const allOptions = questionIds.length > 0
      ? await db
          .select({
            id: assessmentOptions.id,
            questionId: assessmentOptions.questionId,
            optionText: assessmentOptions.optionText,
            position: assessmentOptions.position,
          })
          .from(assessmentOptions)
          .where(inArray(assessmentOptions.questionId, questionIds))
          .orderBy(asc(assessmentOptions.position))
      : [];

    // Restore any answers already saved for this attempt.
    const answers = await db
      .select({
        questionId: assessmentAnswers.questionId,
        selectedOptionId: assessmentAnswers.selectedOptionId,
      })
      .from(assessmentAnswers)
      .where(eq(assessmentAnswers.attemptId, attemptId));

    return NextResponse.json({
      assessment,
      attempt: {
        id: attempt.id,
        status: attempt.status,
      },
      questions: questions.map((question) => ({
        ...question,
        options: allOptions
          .filter((option) => option.questionId === question.id)
          .map(({ id, optionText, position }) => ({
            id,
            optionText,
            position,
          })),
        selectedOptionId:
          answers.find(
            (answer) => answer.questionId === question.id,
          )?.selectedOptionId ?? null,
      })),
    });
  } catch (error) {
    console.error("Failed to load student assessment:", error);

    return NextResponse.json(
      { error: "Could not load this assessment." },
      { status: 500 },
    );
  }
}
