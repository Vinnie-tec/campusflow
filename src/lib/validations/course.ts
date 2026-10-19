
import { z } from "zod";

// Validate the data required to create a course.
export const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Course title must be at least 3 characters long.")
    .max(200, "Course title cannot exceed 200 characters."),

  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters.")
    .optional()
    .transform((value) => value || undefined),
});

// Derive the TypeScript type directly from the schema.
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
