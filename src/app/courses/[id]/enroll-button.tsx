
"use client";

import { useState } from "react";

type EnrollButtonProps = {
  courseId: number;
  initialEnrolled: boolean;
};

export default function EnrollButton({
  courseId,
  initialEnrolled,
}: EnrollButtonProps) {
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/enrollment`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.status === 409) {
        // The student is already enrolled.
        setIsEnrolled(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to enroll.");
      }

      setIsEnrolled(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="my-6">
      <button
        type="button"
        onClick={handleEnroll}
        disabled={isEnrolled || isLoading}
        className="rounded-xl bg-brand px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? "Enrolling..."
          : isEnrolled
            ? "Enrolled"
            : "Enroll in course"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
