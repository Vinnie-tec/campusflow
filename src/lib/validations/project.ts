
import { z } from "zod";

// The status values allowed when creating or updating projects.
const projectStatuses = [
  "planned",
  "in-progress",
  "completed",
] as const;

// Validation rules for creating a project.
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(150, "Project name cannot exceed 150 characters."),

  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters.")
    .nullable()
    .optional(),

  status: z.enum(projectStatuses).default("planned"),
});

// For PATCH, every field is optional because a client
// may want to change only the name or only the status.
export const updateProjectSchema = createProjectSchema
  .omit({ status: true })
  .extend({
    status: z.enum(projectStatuses).optional(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update.",
  );
