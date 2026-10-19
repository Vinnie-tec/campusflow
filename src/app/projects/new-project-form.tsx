
"use client";

import { useActionState } from "react";
import {
  createProject,
  type CreateProjectState,
} from './actions';

const initialState: CreateProjectState = {
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
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-slate-700"
        >
          Project name <span className="text-brand" aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={150}
          placeholder="e.g. Campus garden initiative"
          aria-invalid={Boolean(state.errors?.name?.length)}
          aria-describedby={
            state.errors?.name?.length ? "name-error" : undefined
          }
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            state.errors?.name?.length
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-indigo-100"
          }`}
        />
        {state.errors?.name?.length ? (
          <div
            id="name-error"
            className="space-y-1 text-sm text-rose-700"
            role="alert"
          >
            {state.errors.name.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
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
          rows={5}
          maxLength={2000}
          placeholder="What are you hoping to make happen?"
          aria-invalid={Boolean(state.errors?.description?.length)}
          aria-describedby={
            state.errors?.description?.length
              ? "description-error"
              : undefined
          }
          className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            state.errors?.description?.length
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-indigo-100"
          }`}
        />
        {state.errors?.description?.length ? (
          <div
            id="description-error"
            className="space-y-1 text-sm text-rose-700"
            role="alert"
          >
            {state.errors.description.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
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
