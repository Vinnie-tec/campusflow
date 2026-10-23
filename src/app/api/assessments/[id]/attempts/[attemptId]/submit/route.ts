import { and, eq, inArray } from "drizzle-orm";
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

type SubmittedAnswer = {
  questionId: number;
  selectedOptionId: number | null;
};

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export async function POST(request: Request, { params }: RouteContext) {
  // 1. Authenticate the student.
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
      { error: "Only students can submit assessment answers." },
      { status: 403 },
    );
  }

  // 2. Validate the URL parameters.
  const { id, attemptId: attemptIdParam } = await params;

  const assessmentId = Number(id);
  const attemptId = Number(attemptIdParam);

  if (
    !isPositiveSafeInteger(assessmentId) ||
    !isPositiveSafeInteger(attemptId)
  ) {
    return NextResponse.json(
      { error: "Invalid assessment or attempt ID." },
      { status: 400 },
    );
  }

  // 3. Parse and validate the request body.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must contain valid JSON." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("answers" in body) ||
    !Array.isArray(body.answers)
  ) {
    return NextResponse.json(
      { error: "An answers array is required." },
      { status: 400 },
    );
  }

  const rawAnswers: unknown[] = body.answers;
  const answers: SubmittedAnswer[] = [];

  for (const item of rawAnswers) {
    if (typeof item !== "object" || item === null) {
      return NextResponse.json(
        { error: "Each answer must be an object." },
        { status: 400 },
      );
    }

    if (!("questionId" in item) || !("selectedOptionId" in item)) {
      return NextResponse.json(
        {
          error: "Each answer needs questionId and selectedOptionId.",
        },
        { status: 400 },
      );
    }

    const questionId: unknown = item.questionId;
    const selectedOptionId: unknown = item.selectedOptionId;

    if (!isPositiveSafeInteger(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID." },
        { status: 400 },
      );
    }

    if (selectedOptionId !== null && !isPositiveSafeInteger(selectedOptionId)) {
      return NextResponse.json(
        { error: "Invalid selected option ID." },
        { status: 400 },
      );
    }

    answers.push({
      questionId,
      selectedOptionId,
    });
  }

  // Prevent duplicate answers for the same question.
  const submittedQuestionIds = new Set(
    answers.map((answer) => answer.questionId),
  );

  if (submittedQuestionIds.size !== answers.length) {
    return NextResponse.json(
      { error: "You cannot submit multiple answers for one question." },
      { status: 400 },
    );
  }

  try {
    // 4. Perform validation, saving, and grading in one transaction.
    const result = await db.transaction(async (tx) => {
      // Verify that the attempt belongs to this student.
      const [attempt] = await tx
        .select({
          id: assessmentAttempts.id,
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
        return {
          error: "Assessment attempt not found.",
          status: 404,
        };
      }

      if (attempt.status !== "in_progress") {
        return {
          error: "This attempt has already been submitted or graded.",
          status: 409,
        };
      }

      // Only published assessments can be submitted.
      const [assessment] = await tx
        .select({
          id: assessments.id,
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
        return {
          error: "This assessment is unavailable.",
          status: 404,
        };
      }

      // Load the authoritative questions and their point values.
      const questions = await tx
        .select({
          id: assessmentQuestions.id,
          points: assessmentQuestions.points,
        })
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentId, assessmentId));

      if (questions.length === 0) {
        return {
          error: "This assessment has no questions.",
          status: 400,
        };
      }

      // Require exactly one submission entry per question.
      const validQuestionIds = new Set(
        questions.map((question) => question.id),
      );

      if (
        answers.length !== questions.length ||
        answers.some((answer) => !validQuestionIds.has(answer.questionId))
      ) {
        return {
          error:
            "Submit exactly one answer for every question in this assessment.",
          status: 400,
        };
      }

      const questionIds = questions.map((question) => question.id);

      // Fetch option IDs and correctness directly from PostgreSQL.
      const options = await tx
        .select({
          id: assessmentOptions.id,
          questionId: assessmentOptions.questionId,
          isCorrect: assessmentOptions.isCorrect,
        })
        .from(assessmentOptions)
        .where(inArray(assessmentOptions.questionId, questionIds));

      // Reject an option belonging to a different question.
      for (const answer of answers) {
        if (answer.selectedOptionId === null) {
          continue;
        }

        const optionBelongsToQuestion = options.some(
          (option) =>
            option.id === answer.selectedOptionId &&
            option.questionId === answer.questionId,
        );

        if (!optionBelongsToQuestion) {
          return {
            error: "A selected option does not belong to its question.",
            status: 400,
          };
        }
      }

      // Calculate the score on the server.
      // passingScore and score are treated as percentages.
      const totalPoints = questions.reduce(
        (total, question) => total + question.points,
        0,
      );

      if (totalPoints <= 0) {
        return {
          error: "This assessment has an invalid total point value.",
          status: 400,
        };
      }

      let earnedPoints = 0;

      for (const answer of answers) {
        if (answer.selectedOptionId === null) {
          continue;
        }

        const selectedOption = options.find(
          (option) =>
            option.id === answer.selectedOptionId &&
            option.questionId === answer.questionId,
        );

        const question = questions.find(
          (item) => item.id === answer.questionId,
        );

        if (selectedOption?.isCorrect && question) {
          earnedPoints += question.points;
        }
      }

      const score = Math.round((earnedPoints / totalPoints) * 100);

      const passed = score >= assessment.passingScore;

      // Claim the attempt before writing answers.
      // Only one concurrent submission can change it from in_progress.
      const [claimedAttempt] = await tx
        .update(assessmentAttempts)
        .set({
          status: "submitted",
          submittedAt: new Date(),
        })
        .where(
          and(
            eq(assessmentAttempts.id, attemptId),
            eq(assessmentAttempts.studentId, session.user.id),
            eq(assessmentAttempts.status, "in_progress"),
          ),
        )
        .returning({
          id: assessmentAttempts.id,
        });

      if (!claimedAttempt) {
        return {
          error: "This attempt has already been submitted.",
          status: 409,
        };
      }

      // Replace any saved answers inside the same transaction.
      await tx.insert(assessmentAnswers).values(
        answers.map((answer) => ({
          attemptId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          answeredAt: new Date(),
        })),
      );

      // Finalize the automatically graded attempt.
      await tx
        .update(assessmentAttempts)
        .set({
          score,
          status: "graded",
        })
        .where(eq(assessmentAttempts.id, attemptId));

      return {
        success: true as const,
        result: {
          attemptId,
          score,
          passingScore: assessment.passingScore,
          passed,
          earnedPoints,
          totalPoints,
          status: "graded" as const,
        },
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json({
      message: "Assessment submitted and graded successfully.",
      result: result.result,
    });
  } catch (error) {
    console.error("Failed to submit assessment:", error);

    return NextResponse.json(
      { error: "Could not submit this assessment." },
      { status: 500 },
    );
  }
}
