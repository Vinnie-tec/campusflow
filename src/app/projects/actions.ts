
"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { projects } from "@/lib/db/schema/projects";
import { createProjectSchema } from "@/lib/validations/project";

type CreateProjectState = {
  success: boolean;
  message: string;
};

export async function createProject(
  _previousState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  // 1. Read the submitted form fields.
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
  };

  // 2. Validate the data before writing to the database.
  const validation = createProjectSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message
        ?? "Please check your project details.",
    };
  }

  // 3. Save the validated data.
  try {
    await db.insert(projects).values(validation.data);

    // 4. Refresh cached data for the projects page.
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
