
import { z } from "zod";

export const createAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(200),
  instructions: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((value) => value || undefined),
  passingScore: z.number().int().min(0).max(100).default(50),
});

export type CreateAssessmentInput = z.infer<
  typeof createAssessmentSchema
>;
