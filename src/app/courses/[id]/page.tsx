import { and, eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { lessons } from "@/lib/db/schema/lessons";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { courses } from "@/lib/db/schema/courses";
import EnrollButton from "./enroll-button";
import { enrollments } from "@/lib/db/schema/enrollments";
import ReviewForm from "./review-form";

import { getCourseProgress } from "@/lib/queries/course-progress";
import { getCourseReviewSummary } from "@/lib/queries/course-review-summary";
import { getCourseReviews } from "@/lib/queries/course-reviews";

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
  const conditions =
    session?.user.role === "instructor"
      ? and(eq(courses.id, courseId), eq(courses.instructorId, session.user.id))
      : and(eq(courses.id, courseId), eq(courses.status, "published"));

  const [course] = await db.select().from(courses).where(conditions).limit(1);

  // 5. Show the 404 page if no accessible course exists.
  if (!course) {
    notFound();
  }

  let isEnrolled = false;

  if (session?.user.role === "student") {
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, session.user.id),
          eq(enrollments.courseId, courseId),
        ),
      )
      .limit(1);

    isEnrolled = Boolean(enrollment);
  }

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.position));

  let progress = null;

  if (session?.user.role === "student" && isEnrolled) {
    progress = await getCourseProgress(courseId, session.user.id);
  }

  const [reviewSummary, reviews] = await Promise.all([
    getCourseReviewSummary(courseId),
    getCourseReviews(courseId),
  ]);

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

        <section aria-labelledby="reviews-heading" className="mt-10">
          <h2 id="reviews-heading" className="text-2xl font-semibold">
            Student Reviews
          </h2>

          <div className="mt-3">
            <p>
              <span
                aria-label={`${reviewSummary.averageRating} out of 5 stars`}
              >
                {"★".repeat(Math.round(reviewSummary.averageRating))}
                {"☆".repeat(5 - Math.round(reviewSummary.averageRating))}
              </span>{" "}
              <strong>{reviewSummary.averageRating.toFixed(1)} / 5</strong>
            </p>

            <p className="text-sm text-slate-600">
              {reviewSummary.totalReviews}{" "}
              {reviewSummary.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {reviews.length === 0 ? (
            <p className="mt-5">
              No reviews yet. Be the first to share your experience!
            </p>
          ) : (
            <ul className="mt-5 space-y-5">
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-slate-200 pb-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{review.studentName}</p>

                    <span aria-label={`${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="mt-2 whitespace-pre-wrap">{review.comment}</p>
                  )}

                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {session && session.user.role === "student" && (
            <ReviewForm courseId={courseId} />
          )}
        </section>

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

          {session?.user.role === "student" && (
            <EnrollButton courseId={courseId} initialEnrolled={isEnrolled} />
          )}

          {progress && (
            <section className="my-8 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Your learning progress
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {progress.completedLessons} of {progress.totalLessons}{" "}
                    lessons completed
                  </p>
                </div>

                <span className="text-2xl font-bold">
                  {progress.percentage}%
                </span>
              </div>

              <div
                className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Course completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percentage}
              >
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </section>
          )}

          {!session && (
            <Link
              href="/login"
              className="my-6 inline-flex rounded-xl border px-5 py-3 font-semibold"
            >
              Log in to enroll
            </Link>
          )}

          <section
            aria-labelledby="course-lessons-heading"
            className="mt-10 sm:mt-12"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-brand">
                  COURSE CONTENT
                </p>
                <h2
                  id="course-lessons-heading"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  Course lessons
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                {courseLessons.length}{" "}
                {courseLessons.length === 1 ? "lesson" : "lessons"}
              </span>
            </div>

            {courseLessons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-brand">
                  +
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No lessons yet
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  No lessons have been added to this course yet.
                </p>
              </div>
            ) : (
              <ol className="space-y-3">
                {courseLessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-900/5 sm:p-5"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-brand transition group-hover:bg-brand group-hover:text-white"
                      >
                        {lesson.position}
                      </span>
                      <h3 className="truncate text-base font-semibold tracking-tight text-ink sm:text-lg">
                        {lesson.title}
                      </h3>
                    </div>
                    <Link
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Open lesson
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        -&gt;
                      </span>
                    </Link>
                    {session?.user.role === "instructor" && (
                      <Link
                        href={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        Edit lesson
                      </Link>
                    )}
                    {session?.user.role === "instructor" && (
                      <Link
                        href={`/courses/${courseId}/lessons/new`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <span
                          aria-hidden="true"
                          className="text-base leading-none"
                        >
                          +
                        </span>
                        Add lesson
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
