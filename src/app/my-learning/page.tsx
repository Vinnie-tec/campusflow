import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { enrollments } from "@/lib/db/schema/enrollments";
import { getCourseProgress } from "@/lib/queries/course-progress";

export const instant = false;

export default async function MyLearningPage() {
  // 1. Get the current user's authenticated session.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. Require authentication.
  if (!session) {
    redirect("/login");
  }

  // 3. This page is specifically for students.
  if (session.user.role !== "student") {
    redirect("/courses");
  }

  // 4. Fetch this student's currently published courses.
  const enrolledCourses = await db
    .select({
      enrollmentId: enrollments.id,
      enrolledAt: enrollments.enrolledAt,
      courseId: courses.id,
      title: courses.title,
      description: courses.description,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(
      and(
        eq(enrollments.studentId, session.user.id),
        eq(courses.status, "published"),
      ),
    )
    .orderBy(desc(enrollments.enrolledAt));

  const coursesWithProgress = await Promise.all(
    enrolledCourses.map(async (course) => {
      const progress = await getCourseProgress(
        course.courseId,
        session.user.id,
      );

      return {
        ...course,
        progress,
      };
    }),
  );

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand shadow-sm">
              <span className="size-2 rounded-full bg-indigo-500" />
              STUDENT DASHBOARD
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              My <span className="text-brand">Learning</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              Pick up where you left off and keep making progress in your
              courses.
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Browse courses
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </header>

        <section aria-label="My enrolled courses">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Your courses
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {coursesWithProgress.length} enrolled{" "}
                {coursesWithProgress.length === 1 ? "course" : "courses"}
              </p>
            </div>
          </div>

          {coursesWithProgress.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center sm:px-10">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-brand">
                +
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                Your learning journey starts here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You haven&lsquo;t enrolled in any published courses yet. Explore
                the catalogue and find something new to learn.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Explore courses
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coursesWithProgress.map((course) => (
                <article
                  key={course.enrollmentId}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-brand transition group-hover:bg-brand group-hover:text-white">
                    {course.title.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {course.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 line-clamp-3">
                    {course.description || "No course description provided."}
                  </p>

                  <p className="mt-5 text-xs text-slate-500">
                    Enrolled {course.enrolledAt.toLocaleDateString()}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-sm text-slate-500">
                      {course.progress.completedLessons} of{" "}
                      {course.progress.totalLessons} lessons
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {course.progress.percentage}%
                    </span>
                  </div>

                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${course.title} completion`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={course.progress.percentage}
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${course.progress.percentage}%` }}
                    />
                  </div>

                  <Link
                    href={`/courses/${course.courseId}`}
                    className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {course.progress.percentage === 100
                      ? "Review course"
                      : course.progress.completedLessons > 0
                        ? "Continue learning"
                        : "Start learning"}
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
