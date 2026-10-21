
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
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
    insert: mocks.insert,
  },
}));

import { POST } from "./route";

describe("POST /api/courses", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.insert.mockReturnValue({
      values: mocks.values,
    });

    mocks.values.mockReturnValue({
      returning: mocks.returning,
    });

    mocks.returning.mockResolvedValue([
      {
        id: 1,
        title: "Introduction to React",
        description: "Learn React fundamentals.",
        instructorId: "instructor-1",
        status: "draft",
      },
    ]);
  });

  it("returns 401 when the user is not logged in", async () => {
    mocks.getSession.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/courses",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Introduction to React",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 403 when a student tries to create a course", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "student-1",
        role: "student",
      },
    });

    const request = new Request(
      "http://localhost/api/courses",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Introduction to React",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when an instructor submits invalid data", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "instructor-1",
        role: "instructor",
      },
    });

    const request = new Request(
      "http://localhost/api/courses",
      {
        method: "POST",
        body: JSON.stringify({
          title: "JS",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("creates a draft when an instructor submits valid data", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "instructor-1",
        role: "instructor",
      },
    });

    const request = new Request(
      "http://localhost/api/courses",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Introduction to React",
          description: "Learn React fundamentals.",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.course.title).toBe("Introduction to React");
    expect(body.course.status).toBe("draft");

    expect(mocks.insert).toHaveBeenCalledTimes(1);

    expect(mocks.values).toHaveBeenCalledWith({
      title: "Introduction to React",
      description: "Learn React fundamentals.",
      instructorId: "instructor-1",
      status: "draft",
    });
  });


  it("returns 400 when the request body contains invalid JSON", async () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: "instructor-1",
      role: "instructor",
    },
  });

  const request = new Request(
    "http://localhost/api/courses",
    {
      method: "POST",
      body: "{ invalid json",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const response = await POST(request);
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toBe("Invalid JSON request body.");
  expect(mocks.insert).not.toHaveBeenCalled();
});


it("returns 500 when the database insert fails", async () => {
  mocks.getSession.mockResolvedValue({
    user: {
      id: "instructor-1",
      role: "instructor",
    },
  });

  mocks.returning.mockRejectedValue(
    new Error("Database connection failed"),
  );

  const request = new Request(
    "http://localhost/api/courses",
    {
      method: "POST",
      body: JSON.stringify({
        title: "Introduction to React",
        description: "Learn React fundamentals.",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const response = await POST(request);
  const body = await response.json();

  expect(response.status).toBe(500);
  expect(body.error).toBe(
    "Unable to create the course. Please try again.",
  );
});

});
