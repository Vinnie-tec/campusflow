
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { lessons } from "@/lib/db/schema/lessons";

export const instant = false;

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
}) {
  // 1. Read both IDs from the URL.
  const { id, lessonId } = await params;

  const courseId = Number(id);
  const lessonIdNumber = Number(lessonId);

  // 2. Reject invalid IDs.
  if (
    !Number.isSafeInteger(courseId) ||
    courseId < 1 ||
    !Number.isSafeInteger(lessonIdNumber) ||
    lessonIdNumber < 1
  ) {
    notFound();
  }

  // 3. Get the current user's session.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 4. Build the course access condition.
  const courseCondition =
    session?.user.role === "instructor"
      ? and(
          eq(courses.id, courseId),
          eq(courses.instructorId, session.user.id),
        )
      : and(
          eq(courses.id, courseId),
          eq(courses.status, "published"),
        );

  // 5. Confirm the user can access this course.
  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(courseCondition)
    .limit(1);

  if (!course) {
    notFound();
  }

  // 6. Find the lesson inside this specific course.
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.id, lessonIdNumber),
        eq(lessons.courseId, courseId),
      ),
    )
    .limit(1);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <header className="flex items-center justify-between border-b border-slate-200/80 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
            aria-label="CampusFlow home"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white shadow-lg shadow-slate-900/10">
              C
            </span>
            <span className="text-lg font-bold tracking-tight">campusflow</span>
          </Link>
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-ink"
          >
            <span aria-hidden="true">&larr;</span>
            Back to course
          </Link>
        </header>

        <div className="mx-auto max-w-3xl py-10 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link
              href={`/courses/${course.id}`}
              className="text-sm font-medium text-brand transition hover:text-brand-dark"
            >
              {course.title}
            </Link>
            <span className="mx-2 text-slate-400" aria-hidden="true">
              /
            </span>
            <span className="text-sm text-slate-500">Lesson {lesson.position}</span>
          </nav>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand shadow-sm">
            <span className="size-2 rounded-full bg-indigo-500" />
            LESSON {lesson.position}
          </div>

          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/4">
            <header className="border-b border-slate-100 bg-linear-to-br from-indigo-50/80 via-white to-white px-6 py-8 sm:px-10 sm:py-12">
              <p className="text-sm font-medium text-slate-500">
                {course.title}
              </p>
              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                {lesson.title}
              </h1>
            </header>

            <div className="px-6 py-8 sm:px-10 sm:py-12">
              <p className="whitespace-pre-wrap text-base leading-8 text-slate-700 sm:text-lg sm:leading-9">
                {lesson.content}
              </p>
            </div>
          </article>

          <div className="mt-6">
            <Link
              href={`/courses/${course.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span aria-hidden="true">&larr;</span>
              Return to course lessons
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
