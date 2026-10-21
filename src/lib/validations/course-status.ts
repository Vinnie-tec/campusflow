
import { z } from "zod";

// A course can only be a draft or published.
export const updateCourseStatusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

export type UpdateCourseStatusInput = z.infer<
  typeof updateCourseStatusSchema
>;
