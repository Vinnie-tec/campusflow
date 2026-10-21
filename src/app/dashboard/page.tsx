
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import { enrollments } from "@/lib/db/schema/enrollments";
import { getCourseProgress } from "@/lib/queries/course-progress";

export const instant = false;

export default async function StudentDashboardPage() {
  // 1. Authenticate the user.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // 2. This dashboard is for students only.
  if (session.user.role !== "student") {
    redirect("/courses");
  }

  // 3. Fetch this student's enrolled courses.
  const enrolledCourses = await db
    .select({
      courseId: courses.id,
      title: courses.title,
      description: courses.description,
      enrolledAt: enrollments.enrolledAt,
    })
    .from(enrollments)
    .innerJoin(
      courses,
      eq(enrollments.courseId, courses.id),
    )
    .where(
      and(
        eq(enrollments.studentId, session.user.id),
        eq(courses.status, "published"),
      ),
    )
    .orderBy(enrollments.enrolledAt);

  // 4. Calculate progress for each enrolled course.
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

  // 5. Calculate dashboard statistics.
  const totalCourses = coursesWithProgress.length;

  const completedLessons = coursesWithProgress.reduce(
    (total, course) =>
      total + course.progress.completedLessons,
    0,
  );

  const totalLessons = coursesWithProgress.reduce(
    (total, course) =>
      total + course.progress.totalLessons,
    0,
  );

  const completedCourses = coursesWithProgress.filter(
    (course) =>
      course.progress.totalLessons > 0 &&
      course.progress.percentage === 100,
  ).length;

  const averageProgress =
    totalCourses === 0
      ? 0
      : Math.round(
          coursesWithProgress.reduce(
            (total, course) =>
              total + course.progress.percentage,
            0,
          ) / totalCourses,
        );

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">
              CAMPUSFLOW
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Student dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              Welcome back, {session.user.name}.
              {" "}Continue learning where you left off.
            </p>
          </div>

          <Link
            href="/courses"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:bg-white"
          >
            Browse courses
          </Link>
        </header>

        {/* Dashboard statistics */}
        <section
          aria-label="Learning statistics"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Enrolled courses
            </p>
            <p className="mt-3 text-3xl font-bold">
              {totalCourses}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Completed lessons
            </p>
            <p className="mt-3 text-3xl font-bold">
              {completedLessons}
              <span className="ml-2 text-base font-medium text-slate-400">
                / {totalLessons}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Average progress
            </p>
            <p className="mt-3 text-3xl font-bold">
              {averageProgress}%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Courses completed
            </p>
            <p className="mt-3 text-3xl font-bold">
              {completedCourses}
            </p>
          </div>
        </section>

        {/* Enrolled courses */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              My learning
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Track your progress and continue your courses.
            </p>
          </div>

          {coursesWithProgress.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-semibold">
                Your learning journey starts here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You haven&lsquo;t enrolled in any available courses yet.
                Browse the course catalogue and find something to learn.
              </p>

              <Link
                href="/courses"
                className="mt-5 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Explore courses
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {coursesWithProgress.map((course) => (
                <article
                  key={course.courseId}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {course.description ||
                      "No course description provided."}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      {course.progress.completedLessons} of{" "}
                      {course.progress.totalLessons} lessons
                    </span>

                    <span className="text-sm font-semibold">
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
                      style={{
                        width: `${course.progress.percentage}%`,
                      }}
                    />
                  </div>

                  <Link
                    href={`/courses/${course.courseId}`}
                    className="mt-6 inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    {course.progress.percentage === 100
                      ? "Review course"
                      : course.progress.completedLessons > 0
                        ? "Continue learning"
                        : "Start learning"}
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
