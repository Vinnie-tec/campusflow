
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { CourseStatus } from "@/lib/validations/course-status";

type CourseStatusButtonProps = {
  courseId: number;
  currentStatus: CourseStatus;
};

export default function CourseStatusButton({
  courseId,
  currentStatus,
}: CourseStatusButtonProps) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange() {
    setIsUpdating(true);
    setError("");

    // Switch to the opposite status.
    const nextStatus =
      status === "draft" ? "published" : "draft";

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to update course status.");
        return;
      }

      // Update the button after the server confirms success.
      setStatus(data.course.status);

      // Refresh server-rendered course data.
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleStatusChange}
        disabled={isUpdating}
        className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          status === "draft"
            ? "bg-brand text-white shadow-sm shadow-indigo-500/20 hover:bg-brand-dark focus-visible:outline-brand"
            : "border border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-rose-500"
        }`}
      >
        {isUpdating
          ? "Updating..."
          : status === "draft"
            ? "Publish course"
            : "Unpublish course"}
      </button>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm leading-5 text-rose-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}
