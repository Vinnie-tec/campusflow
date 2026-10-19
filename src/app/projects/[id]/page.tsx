
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { connection } from "next/server";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";
import { auth } from "@/lib/auth";

// Opt out of Instant Navigation prerender validation for this route.
export const instant = false;

type ProjectDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  // Tell Next.js to wait for a real request before
  // executing the request-specific code below.
  await connection();

  // Check who is signed in.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // 2. Read the dynamic route parameter.
  const { id } = await params;
  const projectId = Number(id);

  // 3. Validate the ID before querying the database.
  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    notFound();
  }

  // 4. Fetch only a project owned by this user.
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.ownerId, session.user.id),
      ),
    )
    .limit(1);

  // 5. Hide missing or unauthorized projects.
  if (!project) {
    notFound();
  }

  // 6. Display the project details.
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/projects">← Back to projects</Link>

      <article className="mt-8">
        <h1 className="text-3xl font-bold">{project.name}</h1>

        <p className="mt-4">
          {project.description || "No description provided."}
        </p>

        <p className="mt-4">
          Status: {project.status}
        </p>

        <p className="mt-2 text-sm">
          Created: {project.createdAt.toLocaleDateString()}
        </p>
      </article>
    </main>
  );
}
