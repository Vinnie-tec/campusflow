import { desc } from "drizzle-orm";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";

import { createProjectSchema } from "@/lib/validations/project";

// This GET handler responds to requests sent to /api/projects.
export async function GET() {
  try {
    // Ask PostgreSQL for the projects using Drizzle.
    // Newest projects appear first.
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    // Return the database results as JSON.
    return Response.json({
      success: true,
      data: allProjects,
    });
  } catch (error) {
    // Log the real error on the server for debugging.
    console.error("Failed to fetch projects:", error);

    // Send a generic message to the client.
    // Avoid exposing database details to the caller.
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
