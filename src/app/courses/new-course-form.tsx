
"use client";

import { useState } from "react";

export default function NewCourseForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create course.");
        return;
      }

      setSuccess("Course created successfully!");
      setTitle("");
      setDescription("");
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
          Course title{" "}
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
          placeholder="e.g. Introduction to biology"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-slate-700"
        >
          Description{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          rows={5}
          placeholder="What will learners explore or learn?"
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create course"}
        {!isSubmitting && <span aria-hidden="true">-&gt;</span>}
      </button>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}
    </form>
  );
}
