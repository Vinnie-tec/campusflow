
import { z } from "zod";

export const createAssessmentQuestionSchema = z.object({
  questionText: z.string().trim().min(5).max(2000),

  points: z.number().int().min(1).max(100).default(1),

  position: z.number().int().min(1).optional(),

  options: z
    .array(
      z.object({
        optionText: z.string().trim().min(1).max(500),
        isCorrect: z.boolean(),
      }),
    )
    .min(2, "A question must have at least two options.")
    .max(6, "A question cannot have more than six options.")
    .refine(
      (options) => options.filter((option) => option.isCorrect).length === 1,
      "Exactly one option must be correct.",
    ),
});

export type CreateAssessmentQuestionInput = z.infer<
  typeof createAssessmentQuestionSchema
>;
