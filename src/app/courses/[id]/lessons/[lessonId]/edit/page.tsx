import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { lessons } from "@/lib/db/schema/lessons";

import EditLessonForm from "./edit-lesson-form";

export const instant = false;

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;

  const courseId = Number(id);
  const parsedLessonId = Number(lessonId);

  if (
    !Number.isSafeInteger(courseId) ||
    courseId < 1 ||
    !Number.isSafeInteger(parsedLessonId) ||
    parsedLessonId < 1
  ) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  if (session.user.role !== "instructor") {
    redirect("/courses");
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(
      and(eq(courses.id, courseId), eq(courses.instructorId, session.user.id)),
    )
    .limit(1);

  if (!course) notFound();

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, parsedLessonId), eq(lessons.courseId, courseId)))
    .limit(1);

  if (!lesson) notFound();

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
            href={`/courses/${courseId}`}
            className="text-sm font-semibold text-slate-500 transition hover:text-ink"
          >
            Back to course
          </Link>
        </header>

        <div className="mx-auto grid max-w-5xl gap-10 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-20">
          <section className="pt-2">
            <div className="text-sm">
              <Link
                href={`/courses/${courseId}`}
                className="font-semibold text-brand transition hover:text-brand-dark"
              >
                {course.title}
              </Link>
              <span className="mx-2 text-slate-400" aria-hidden="true">
                /
              </span>
              <span className="text-slate-500">Edit lesson</span>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand shadow-sm">
              <span className="size-2 rounded-full bg-indigo-500" />
              LESSON {lesson.position}
            </div>
            <h1 className="mt-6 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Refine your
              <span className="block text-brand">lesson content.</span>
            </h1>
            <p className="mt-5 max-w-md leading-7 text-slate-600">
              Update the title, content, or position of this lesson. Your
              changes will be reflected in the course outline.
            </p>

            <div className="mt-9 rounded-2xl border border-slate-200/80 bg-white/70 p-5">
              <p className="text-sm font-semibold">Editing in</p>
              <p className="mt-2 text-base font-medium text-brand">
                {course.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Lesson order is set by its position number. Choose a positive
                whole number to place it in the course.
              </p>
            </div>
          </section>

          <section
            aria-label="Edit lesson details"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/4 sm:p-9"
          >
            <div className="mb-7 border-b border-slate-100 pb-6">
              <h2 className="text-xl font-semibold tracking-tight">
                Lesson details
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Make your changes below and save when you&apos;re done.
              </p>
            </div>
            <EditLessonForm
              courseId={courseId}
              lessonId={parsedLessonId}
              initialTitle={lesson.title}
              initialContent={lesson.content}
              initialPosition={lesson.position}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
