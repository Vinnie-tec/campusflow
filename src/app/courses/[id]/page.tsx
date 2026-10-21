
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";

export const instant = false;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Read the course ID from the URL.
  const { id } = await params;
  const courseId = Number(id);

  // 2. Reject invalid IDs.
  if (!Number.isSafeInteger(courseId) || courseId < 1) {
    notFound();
  }

  // 3. Check the current user's session.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 4. Find the course the user is allowed to view.
  const conditions = session?.user.role === "instructor"
    ? and(
        eq(courses.id, courseId),
        eq(courses.instructorId, session.user.id),
      )
    : and(
        eq(courses.id, courseId),
        eq(courses.status, "published"),
      );

  const [course] = await db
    .select()
    .from(courses)
    .where(conditions)
    .limit(1);

  // 5. Show the 404 page if no accessible course exists.
  if (!course) {
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
            href="/courses"
            className="text-sm font-semibold text-slate-500 transition hover:text-ink"
          >
            Back to courses
          </Link>
        </header>

        <div className="mx-auto max-w-4xl py-12 sm:py-16">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand shadow-sm">
              <span className="size-2 rounded-full bg-indigo-500" />
              COURSE DETAILS
            </span>
          </div>

          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/4">
            <div className="border-b border-slate-100 bg-linear-to-br from-indigo-50/80 via-white to-white px-6 py-10 sm:px-10 sm:py-14">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h1 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                  {course.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${
                    course.status === "published"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      course.status === "published"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                  />
                  {course.status}
                </span>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                About this course
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-8 text-slate-700">
                {course.description || "No description provided."}
              </p>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
