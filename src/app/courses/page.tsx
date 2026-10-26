import { headers } from "next/headers";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import CourseStatusButton from "./course-status-button";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";

export const instant = false;

export default async function CoursesPage() {
  // Identify the current user, if they are logged in.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Instructors see only courses they created.
  // Students and visitors see published courses only.
  const courseList =
    session?.user.role === "instructor"
      ? await db
          .select()
          .from(courses)
          .where(eq(courses.instructorId, session.user.id))
          .orderBy(desc(courses.createdAt))
      : await db
          .select()
          .from(courses)
          .where(eq(courses.status, "published"))
          .orderBy(desc(courses.createdAt));

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
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <Link
              href="/projects"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink"
            >
              Projects
            </Link>
            {session?.user.role === "student" && (
              <Link
                href="/my-learning"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink"
              >
                My learning
              </Link>
            )}
            {!session && (
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink"
              >
                Sign in
              </Link>
            )}
            {session?.user.role === "instructor" && (
              <Link
                href="/courses/new"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Create a course
                <span aria-hidden="true">-&gt;</span>
              </Link>
            )}
          </nav>
        </header>

        <section className="py-12 sm:py-16">
          <div className="mb-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand shadow-sm">
              <span className="size-2 rounded-full bg-indigo-500" />
              {session?.user.role === "instructor"
                ? "INSTRUCTOR DASHBOARD"
                : "LEARN SOMETHING NEW"}
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {session?.user.role === "instructor" ? (
                <>
                  My <span className="text-brand">Courses</span>
                </>
              ) : (
                <>
                  Explore <span className="text-brand">Courses</span>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              {session?.user.role === "instructor"
                ? "Manage your courses and keep your learning materials organized."
                : "Discover courses created to help you learn, grow, and move forward."}
            </p>
          </div>

          {courseList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center sm:px-10">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-brand">
                {session?.user.role === "instructor" ? "+" : "i"}
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">
                {session?.user.role === "instructor"
                  ? "Your courses will appear here"
                  : "No courses available yet"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {session?.user.role === "instructor"
                  ? "You haven't created any courses yet. Create your first course to get started."
                  : "No published courses are available yet. Check back soon for new learning opportunities."}
              </p>
              {session?.user.role === "instructor" && (
                <Link
                  href="/courses/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Create your first course
                  <span aria-hidden="true">-&gt;</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courseList.map((course) => (
                <article
                  key={course.id}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-brand transition group-hover:bg-brand group-hover:text-white">
                    {course.title.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {course.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    {course.description || "No description provided."}
                  </p>
                  {session?.user.role === "instructor" && (
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
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
                  )}
                  {session?.user.role === "instructor" &&
                    (course.status === "draft" ||
                      course.status === "published") && (
                      <CourseStatusButton
                        courseId={course.id}
                        currentStatus={course.status}
                      />
                    )}
                  <Link
                    href={`/courses/${course.id}`}
                    className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    View course
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      -&gt;
                    </span>
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
