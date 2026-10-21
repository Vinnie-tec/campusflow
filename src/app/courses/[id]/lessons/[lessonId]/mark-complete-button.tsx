
"use client";

import { useState } from "react";

type MarkCompleteButtonProps = {
  courseId: number;
  lessonId: number;
  initialCompleted: boolean;
};

export default function MarkCompleteButton({
  courseId,
  lessonId,
  initialCompleted,
}: MarkCompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/progress`,
        { method: "POST" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update lesson progress.",
        );
      }

      setIsCompleted(true);
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
    <div className="mt-8">
      <button
        type="button"
        onClick={handleComplete}
        disabled={isCompleted || isLoading}
        className="rounded-xl bg-brand px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? "Saving progress..."
          : isCompleted
            ? "✓ Lesson completed"
            : "Mark as complete"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
