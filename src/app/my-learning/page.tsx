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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium text-slate-500">STUDENT DASHBOARD</p>

        <h1 className="mt-2 text-3xl font-bold">My Learning</h1>

        <p className="mt-3 text-slate-600">
          Continue your courses and keep track of your learning.
        </p>
      </header>

      {enrolledCourses.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 p-8">
          <h2 className="text-xl font-semibold">
            You haven&lsquo;t enrolled in any published courses yet.
          </h2>

          <p className="mt-2 text-slate-600">
            Explore the course catalogue to find something to learn.
          </p>

          <Link
            href="/courses"
            className="mt-5 inline-flex font-semibold underline"
          >
            Browse courses
          </Link>
        </section>
      ) : (
        <section>
          <p className="mb-5 text-sm text-slate-500">
            {enrolledCourses.length} enrolled{" "}
            {enrolledCourses.length === 1 ? "course" : "courses"}
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {enrolledCourses.map((course) => (
              <article
                key={course.enrollmentId}
                className="rounded-2xl border border-slate-200 p-6"
              >
                <h2 className="text-xl font-semibold">{course.title}</h2>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {course.description || "No description available."}
                </p>

                <p className="mt-4 text-xs text-slate-500">
                  Enrolled {course.enrolledAt.toLocaleDateString()}
                </p>

                <Link
                  href={`/courses/${course.courseId}`}
                  className="mt-5 inline-flex font-semibold underline"
                >
                  Continue learning
                </Link>
              </article>
            ))}
          </div>

          {coursesWithProgress.map((course) => (
            <article key={course.enrollmentId}>
              <h2>{course.title}</h2>

              <p>
                {course.progress.completedLessons} of{" "}
                {course.progress.totalLessons} lessons completed
              </p>

              <p>{course.progress.percentage}% complete</p>

              <Link href={`/courses/${course.courseId}`}>
                Continue learning
              </Link>
                  <div
            role="progressbar"
            aria-label={`${course.title} completion`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={course.progress.percentage}
            className="h-2 overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${course.progress.percentage}%` }}
            />
          </div>
            </article>
          ))}

      
        </section>
      )}
    </main>
  );
}
