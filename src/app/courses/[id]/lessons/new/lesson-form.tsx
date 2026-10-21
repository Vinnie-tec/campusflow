
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LessonFormProps = {
  courseId: number;
};

export default function LessonForm({ courseId }: LessonFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [position, setPosition] = useState("1");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          position: Number(position),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create lesson.");
        return;
      }

      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-semibold text-slate-700"
        >
          Lesson title{" "}
          <span className="text-brand" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={3}
          maxLength={200}
          required
          placeholder="e.g. Getting started"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="content"
          className="block text-sm font-semibold text-slate-700"
        >
          Lesson content{" "}
          <span className="text-brand" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id="content"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={50000}
          required
          rows={8}
          placeholder="Write the lesson content here..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="position"
          className="block text-sm font-semibold text-slate-700"
        >
          Lesson position{" "}
          <span className="text-brand" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="position"
          name="position"
          type="number"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          min={1}
          step={1}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100 sm:max-w-40"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Creating lesson..." : "Create lesson"}
        {!isSubmitting && <span aria-hidden="true">-&gt;</span>}
      </button>
    </form>
  );
}
