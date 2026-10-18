
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
    <form action={formAction}>
      <div>
        <label htmlFor="name">Project name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
        />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create project"}
      </button>

      {state.message && (
        <p role="status">{state.message}</p>
      )}
    </form>
  );
}
