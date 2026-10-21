import { z } from "zod";

export const updateCourseStatusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

export type CourseStatus = z.infer<
  typeof updateCourseStatusSchema
>["status"];

export type UpdateCourseStatusInput = z.infer<
  typeof updateCourseStatusSchema
>;