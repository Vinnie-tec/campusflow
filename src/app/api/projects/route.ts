import { desc } from "drizzle-orm";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";

import { auth } from "@/lib/auth";

import { createProjectSchema } from "@/lib/validations/project";

// This GET handler responds to requests sent to /api/projects.
export async function GET(request: Request) {
  // Step 1: Ask Better Auth to identify the user from this request's headers.
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Step 2: Reject the request if there is no valid session.
  if (!session) {
    return Response.json(
      {
        success: false,
        message: "You must be logged in to view projects.",
      },
      { status: 401 },
    );
  }

  // Step 3: Only authenticated users reach this database query.
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return Response.json({
      success: true,
      data: allProjects,
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch projects.",
      },
      { status: 500 },
    );
  }
}
// POST: Create a new project.
export async function POST(request: Request) {
  // 1. Check whether the requester has a valid session.
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // 2. Reject the request if the requester is not logged in.
  if (!session) {
    return Response.json(
      {
        success: false,
        message: "You must be logged in to create a project.",
      },
      { status: 401 },
    );
  }

  // First, parse the incoming JSON.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "Request body must contain valid JSON.",
      },
      { status: 400 },
    );
  }

  // Validate the data before touching the database.
  const validation = createProjectSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
      {
        success: false,
        message: "Invalid project data.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    // Use validated data, never the original untrusted body.
    const [newProject] = await db
      .insert(projects)
      .values(validation.data)
      .returning();

    return Response.json(
      {
        success: true,
        data: newProject,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create project:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create project.",
      },
      { status: 500 },
    );
  }
}
