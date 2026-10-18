
"use client";

import { useActionState } from "react";
import { createProject } from "./actions";

const initialState = {
  success: false,
  message: "",
};

export default function NewProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProject,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
          Project name <span className="text-brand" aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={150}
          placeholder="e.g. Campus garden initiative"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
          Description <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          placeholder="What are you hoping to make happen?"
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create project"}
        {!isPending && <span aria-hidden="true">-&gt;</span>}
      </button>

      {state.message && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
