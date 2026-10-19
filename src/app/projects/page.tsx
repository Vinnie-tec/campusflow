import Link from "next/link";
import { eq, desc, count } from "drizzle-orm";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";
import NewProjectForm from "./new-project-form";
import { connection } from "next/server"; // 1. Import connection

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

import ProjectStats from "./project-stats";

import ProjectList from "./project-list";
import ProjectPagination from "./project-pagination";

const PAGE_SIZE = 10;

type ProjectsPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

// export const dynamic = "force-dynamic";
// Add this line to opt out of instant-navigation prerender validation for this route:
export const instant = false;

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  // Keep your existing connection(), session check,
  // and redirect logic here.

  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");

  // Only accept positive, whole-number page values.
  const currentPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const offset = (currentPage - 1) * PAGE_SIZE;

  // We'll add the paginated database query here.

  await connection(); // 2. Await the connection at the top of the page
  // 1. Verify the current user's session.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. Send signed-out users to the login page.
  if (!session) {
    redirect("/login");
  }

  // Count all projects owned by the signed-in user.
  const [result] = await db
    .select({ total: count() })
    .from(projects)
    .where(eq(projects.ownerId, session.user.id));

  const totalProjects = result.total;
  const totalPages = Math.max(1, Math.ceil(totalProjects / PAGE_SIZE));

  // Prevent someone from requesting a page beyond the last page.
  const safePage = Math.min(currentPage, totalPages);
  const safeOffset = (safePage - 1) * PAGE_SIZE;

  // Fetch only the projects for this page.
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, session.user.id))
    .orderBy(desc(projects.createdAt), desc(projects.id))
    .limit(PAGE_SIZE)
    .offset(safeOffset);

  // Count the signed-in user's projects, grouped by status.
  const projectStatsByStatus = await db
    .select({
      status: projects.status,
      total: count(),
    })
    .from(projects)
    .where(eq(projects.ownerId, session.user.id))
    .groupBy(projects.status);

  // Convert the grouped database results into easy-to-use values.

  const plannedProjects =
    projectStatsByStatus.find((item) => item.status === "planned")?.total ?? 0;

  const inProgressProjects =
    projectStatsByStatus.find((item) => item.status === "in-progress")?.total ??
    0;

  const completedProjects =
    projectStatsByStatus.find((item) => item.status === "completed")?.total ??
    0;

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
            href="/"
            className="text-sm font-semibold text-slate-500 transition hover:text-ink"
          >
            Back to home
          </Link>
        </header>

        <div className="mx-auto grid max-w-5xl gap-12 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-20">
          <section className="pt-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand shadow-sm">
              <span className="size-2 rounded-full bg-indigo-500" />
              NEW PROJECT
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Start with a<span className="block text-brand">bright idea.</span>
            </h1>
            <p className="mt-5 max-w-md leading-7 text-slate-600">
              Give your project a home. Add a name and a few details now; you
              can build on it as your plans take shape.
            </p>

            <div className="mt-9 rounded-2xl border border-slate-200/80 bg-white/70 p-5">
              <p className="text-sm font-semibold">A good place to begin</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                A clear project name makes it easy to find later. Use the
                description to capture the goal, the people, or the first thing
                you want to figure out.
              </p>
            </div>
          </section>

          <section
            aria-label="Project details"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/4 sm:p-9"
          >
            <div className="mb-7 border-b border-slate-100 pb-6">
              <h2 className="text-xl font-semibold tracking-tight">
                Project details
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                The basics. You can always refine them later.
              </p>
            </div>
            <NewProjectForm />
          </section>
        </div>

        <section
          aria-labelledby="projects-heading"
          className="mx-auto max-w-5xl pb-12 sm:pb-16 lg:pb-20"
        >
          <ProjectList projects={userProjects} />

          <ProjectPagination currentPage={safePage} totalPages={totalPages} />
        </section>

        <ProjectStats
          total={totalProjects}
          planned={plannedProjects}
          inProgress={inProgressProjects}
          completed={completedProjects}
        />
      </div>
    </main>
  );
}
