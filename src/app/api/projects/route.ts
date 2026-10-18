
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