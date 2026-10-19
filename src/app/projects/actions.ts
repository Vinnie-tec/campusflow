
"use server";

import { revalidatePath } from "next/cache";
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
  // Collect the values submitted by the form.
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
  };

  // Validate the data on the server.
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
    // Save the validated project.
    await db.insert(projects).values(validation.data);

    // Refresh the projects page after a successful insert.
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
