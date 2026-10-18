
import { desc } from "drizzle-orm";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";

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
  try {
    // Read the JSON data sent by the client.
    const body = await request.json();

    // Insert the new project into PostgreSQL.
    const [newProject] = await db
      .insert(projects)
      .values({
        name: body.name,
        description: body.description,
        status: body.status ?? "planned",
      })
      .returning();

    // Return the project PostgreSQL created.
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