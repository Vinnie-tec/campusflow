
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";
import { createProjectSchema } from "@/lib/validations/project";

export type CreateProjectState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    description?: string[];
  };
};

export async function createProject(
  _previousState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  // 1. Verify the user's session.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. Stop if the user is not logged in.
  if (!session) {
    return {
      success: false,
      message: "You must be logged in to create a project.",
    };
  }

  // 3. Collect the values submitted by the form.
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
  };

  // 4. Validate the submitted data on the server.
  const validation = createProjectSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Please correct the errors below.",
      errors: {
        name: fieldErrors.name,
        description: fieldErrors.description,
      },
    };
  }

  try {
    // 5. Save the project and assign its authenticated owner.
    await db.insert(projects).values({
      ...validation.data,
      ownerId: session.user.id,
    });

    // 6. Refresh the projects page after a successful insert.
    revalidatePath("/projects");

    return {
      success: true,
      message: "Project created successfully.",
    };
  } catch (error) {
    console.error("Failed to create project:", error);

    return {
      success: false,
      message: "Unable to create the project. Please try again.",
    };
  }
}
