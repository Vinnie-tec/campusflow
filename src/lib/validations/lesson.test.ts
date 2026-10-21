
import { describe, expect, it } from "vitest";
import { createLessonSchema } from "./lesson";

describe("createLessonSchema", () => {
  it("accepts valid lesson data", () => {
    const result = createLessonSchema.safeParse({
      title: "Introduction to HTML",
      content: "HTML provides the structure of a web page.",
      position: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 3 characters", () => {
    const result = createLessonSchema.safeParse({
      title: "JS",
      content: "Learn JavaScript.",
      position: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty lesson content", () => {
    const result = createLessonSchema.safeParse({
      title: "Introduction to HTML",
      content: "   ",
      position: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a position that is not a whole number", () => {
    const result = createLessonSchema.safeParse({
      title: "Introduction to HTML",
      content: "Learn HTML.",
      position: 1.5,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a position of zero", () => {
    const result = createLessonSchema.safeParse({
      title: "Introduction to HTML",
      content: "Learn HTML.",
      position: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative position", () => {
    const result = createLessonSchema.safeParse({
      title: "Introduction to HTML",
      content: "Learn HTML.",
      position: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects content longer than 50000 characters", () => {
    const result = createLessonSchema.safeParse({
      title: "Introduction to HTML",
      content: "a".repeat(50001),
      position: 1,
    });

    expect(result.success).toBe(false);
  });

  it("trims whitespace around the lesson title", () => {
    const result = createLessonSchema.safeParse({
      title: "  Introduction to HTML  ",
      content: "Learn HTML.",
      position: 1,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe("Introduction to HTML");
    }
  });
});
