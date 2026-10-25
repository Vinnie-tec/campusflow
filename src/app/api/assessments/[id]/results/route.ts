import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { assessments } from "@/lib/db/schema/assessments";
import { courses } from "@/lib/db/schema/courses";
import { assessmentAttempts } from "@/lib/db/schema/assessment-attempts";
import { user } from "@/lib/db/schema/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  if (session.user.role !== "instructor") {
    return Response.json(
      { error: "Only instructors can view assessment results." },
      { status: 403 },
    );
  }
  const { id } = await params;
  const assessmentId = Number(id);
  if (!Number.isSafeInteger(assessmentId) || assessmentId <= 0) {
    return Response.json({ error: "Invalid assessment ID." }, { status: 400 });
  }
  try {
    // Confirm that this assessment belongs to a course
    // owned by the currently signed-in instructor.
    const [assessment] = await db
      .select()
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
      return Response.json({ error: "Assessment not found." }, { status: 404 });
    }

    const attempts = await db
      .select({
        attemptId: assessmentAttempts.id,
        studentId: assessmentAttempts.studentId,
        studentName: user.name,
        studentEmail: user.email,
        score: assessmentAttempts.score,
        status: assessmentAttempts.status,
        startedAt: assessmentAttempts.startedAt,
        submittedAt: assessmentAttempts.submittedAt,
      })
      .from(assessmentAttempts)
      .innerJoin(user, eq(assessmentAttempts.studentId, user.id))
      .where(eq(assessmentAttempts.assessmentId, assessmentId))
      .orderBy(desc(assessmentAttempts.startedAt));

    return Response.json({
      assessment: {
        id: assessment.assessments.id,
        title: assessment.assessments.title,
        passingScore: assessment.assessments.passingScore,
      },
      results: attempts.map((attempt) => ({
        ...attempt,
        passed:
          attempt.score !== null && attempt.score >= assessment.assessments.passingScore,
      })),
    });
  } catch (error) {
    console.error("Failed to load assessment results:", error);

    return Response.json(
      { error: "Unable to load assessment results." },
      { status: 500 },
    );
  }
}
