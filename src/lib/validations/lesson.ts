
import { z } from "zod";

export const createLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Lesson title must be at least 3 characters.")
    .max(200, "Lesson title cannot exceed 200 characters."),

  content: z
    .string()
    .trim()
    .min(1, "Lesson content cannot be empty.")
    .max(50000, "Lesson content cannot exceed 50,000 characters."),

  position: z
    .number()
    .int("Lesson position must be a whole number.")
    .positive("Lesson position must be greater than zero."),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
