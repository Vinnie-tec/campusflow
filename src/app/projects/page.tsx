import Link from "next/link";
import { eq, desc } from "drizzle-orm";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";
import NewProjectForm from "./new-project-form";
import ProjectCardActions from "./project-card-actions";
import { connection } from "next/server"; // 1. Import connection

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// export const dynamic = "force-dynamic";
// Add this line to opt out of instant-navigation prerender validation for this route:
export const instant = false;

export default async function ProjectsPage() {
  await connection(); // 2. Await the connection at the top of the page
// 1. Verify the current user's session.
const session = await auth.api.getSession({
  headers: await headers(),
});

// 2. Send signed-out users to the login page.
if (!session) {
  redirect("/login");
}

// 3. Retrieve only projects owned by this user.
const userProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.ownerId, session.user.id))
  .orderBy(desc(projects.createdAt));

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
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="projects-heading"
                className="text-2xl font-semibold tracking-tight"
              >
                All projects
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Your projects, all in one place.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600">
              {userProjects.length}{" "}
              {userProjects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          {userProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
              <p className="font-semibold text-slate-700">No projects yet</p>
              <p className="mt-1.5 text-sm text-slate-500">
                Create your first project using the form above.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {userProjects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="wrap-break-word font-semibold tracking-tight">
                      {project.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        project.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : project.status === "in-progress"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {project.status === "in-progress"
                        ? "In progress"
                        : project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
                    {project.description || "No description provided."}
                  </p>
                  <ProjectCardActions project={project} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
