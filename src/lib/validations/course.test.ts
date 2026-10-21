import { describe, expect, it } from "vitest";
import { createCourseSchema } from "./course";

describe("createCourseSchema", () => {
  it("accepts valid course data", () => {
    const result = createCourseSchema.safeParse({
      title: "Introduction to React",
      description: "Learn React fundamentals.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 3 characters", () => {
    const result = createCourseSchema.safeParse({
      title: "JS",
      description: "Learn JavaScript.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = createCourseSchema.safeParse({
      title: "",
      description: "Learn JavaScript.",
    });

    expect(result.success).toBe(false);
  });

  it("trims whitespace around the title", () => {
    const result = createCourseSchema.safeParse({
      title: "  React Fundamentals  ",
      description: "Learn React.",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe("React Fundamentals");
    }
  });

  it("allows the description to be omitted", () => {
    const result = createCourseSchema.safeParse({
      title: "Introduction to React",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = createCourseSchema.safeParse({
      title: "Introduction to React",
      description: "a".repeat(5001),
    });

    expect(result.success).toBe(false);
  });
});