import { describe, expect, it } from "vitest";
import { calculatePercentage } from "./percentage";

describe("calculatePercentage", () => {
  it("calculates partial progress", () => {
    expect(calculatePercentage(2, 5)).toBe(40);
  });

  it("returns 100 when all lessons are completed", () => {
    expect(calculatePercentage(5, 5)).toBe(100);
  });

  it("returns 0 when no lessons are completed", () => {
    expect(calculatePercentage(0, 5)).toBe(0);
  });

  it("returns 0 when the course has no lessons", () => {
    expect(calculatePercentage(0, 0)).toBe(0);
  });
});