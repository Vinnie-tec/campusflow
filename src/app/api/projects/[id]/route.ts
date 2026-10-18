
import { eq } from "drizzle-orm";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";

// PATCH: Update one project using its ID.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Read the ID from the URL.
    const { id } = await context.params;
    const projectId = Number(id);

    // Reject IDs that are not positive integers.
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return Response.json(
        { success: false, message: "Invalid project ID." },
        { status: 400 },
      );
    }

    // Read the changes sent by the client.
    const body = await request.json();

    // Update only the project whose ID matches.
    const [updatedProject] = await db
      .update(projects)
      .set({
        name: body.name,
        description: body.description,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    // No returned row means that ID does not exist.
    if (!updatedProject) {
      return Response.json(
        { success: false, message: "Project not found." },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Failed to update project:", error);

    return Response.json(
      { success: false, message: "Failed to update project." },
      { status: 500 },
    );
  }
}

// DELETE: Remove one project using its ID.
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Get the project ID from the URL.
    const { id } = await context.params;
    const projectId = Number(id);

    // Make sure the ID is a positive integer.
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return Response.json(
        { success: false, message: "Invalid project ID." },
        { status: 400 },
      );
    }

    // Delete only the project with this ID.
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    // Check whether a project was actually deleted.
    if (!deletedProject) {
      return Response.json(
        { success: false, message: "Project not found." },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Project deleted successfully.",
      data: deletedProject,
    });
  } catch (error) {
    console.error("Failed to delete project:", error);

    return Response.json(
      { success: false, message: "Failed to delete project." },
      { status: 500 },
    );
  }
}

