import { eq } from "drizzle-orm";

import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";

import { auth } from "@/lib/auth";

import { updateProjectSchema } from "@/lib/validations/project";

// PATCH: Update one project using its ID.

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  // 1. Check whether the requester has a valid session.
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // 2. Stop if the requester is not logged in.
  if (!session) {
    return Response.json(
      {
        success: false,
        message: "You must be logged in to update a project.",
      },
      { status: 401 },
    );
  }
  // Step 3: Read and validate the project ID.
  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return Response.json(
      {
        success: false,
        message: "Invalid project ID.",
      },
      { status: 400 },
    );
  }

  // Step 2: Parse the request body safely.
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

  // Step 3: Validate the fields being updated.
  const validation = updateProjectSchema.safeParse(body);

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
    // Step 4: Update only the validated fields.
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    // Step 5: Handle a project ID that does not exist.
    if (!updatedProject) {
      return Response.json(
        {
          success: false,
          message: "Project not found.",
        },
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
      {
        success: false,
        message: "Failed to update project.",
      },
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
    // 1. Check whether the requester has a valid session.
    const session = await auth.api.getSession({
      headers: _request.headers,
    });

    // 2. Reject the request if the requester is not logged in.
    if (!session) {
      return Response.json(
        {
          success: false,
          message: "You must be logged in to delete a project.",
        },
        { status: 401 },
      );
    }
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
