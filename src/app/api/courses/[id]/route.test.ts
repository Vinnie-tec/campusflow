
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  returning: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  default: {
    update: mocks.update,
  },
}));

import { PATCH } from "./route";

describe("PATCH /api/courses/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.update.mockReturnValue({
      set: mocks.set,
    });

    mocks.set.mockReturnValue({
      where: mocks.where,
    });

    mocks.where.mockReturnValue({
      returning: mocks.returning,
    });

    // Simulate no course matching both the ID
    // and the authenticated instructor.
    mocks.returning.mockResolvedValue([]);
  });

  it("returns 404 when the instructor does not own the course", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "instructor-2",
        role: "instructor",
      },
    });

    const request = new Request(
      "http://localhost/api/courses/1",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "published",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });

    const body = await response.json();

    expect(response.status).toBe(404);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.returning).toHaveReturnedTimes(1);
    // console.log(body)
  });

  
it("returns 403 when a student tries to publish a course", async () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: "student-1",
      role: "student",
    },
  });

  const request = new Request(
    "http://localhost/api/courses/1",
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "published",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const response = await PATCH(request, {
    params: Promise.resolve({ id: "1" }),
  });

  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.error).toBe(
    "Only instructors can update courses.",
  );

  // The API must reject the request before
  // attempting to update the database.
  expect(mocks.update).not.toHaveBeenCalled();
});

});
