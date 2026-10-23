
import { z } from "zod";

export const createCourseReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating cannot exceed 5."),

  comment: z
    .string()
    .trim()
    .max(2000, "Review cannot exceed 2000 characters.")
    .optional()
    .transform((value) => value || undefined),
});

export type CreateCourseReviewInput = z.infer<
  typeof createCourseReviewSchema
>;
