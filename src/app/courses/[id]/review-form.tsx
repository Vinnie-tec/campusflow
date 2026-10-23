
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ReviewFormProps = {
  courseId: number;
};

export default function ReviewForm({ courseId }: ReviewFormProps) {
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
            comment,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to submit your review.");
        return;
      }

      setSuccess("Your review has been submitted!");
      setRating(0);
      setComment("");

      // Refresh the Server Component so the new review appears.
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <p className="mb-2 font-medium">Your rating</p>

        <div className="flex gap-2" role="group" aria-label="Choose a rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              className="text-3xl"
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              onFocus={() => setHoveredRating(value)}
              onBlur={() => setHoveredRating(0)}
              onClick={() => setRating(value)}
            >
              {(hoveredRating || rating) >= value ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className="mb-2 block font-medium">
          Your review (optional)
        </label>

        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="What did you think about this course?"
          className="w-full rounded-md border p-3"
        />

        <p className="mt-1 text-sm text-slate-500">
          {comment.length}/2000 characters
        </p>
      </div>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-green-700">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md border px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
