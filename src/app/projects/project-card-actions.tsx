"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { projects } from "@/lib/db/schema/projects";

type Project = typeof projects.$inferSelect;

type ProjectCardActionsProps = {
  project: Project;
};

function getResponseMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }

  const message =
    "message" in body && typeof body.message === "string"
      ? body.message
      : undefined;
  const details =
    "errors" in body && Array.isArray(body.errors)
      ? body.errors.flatMap((issue): string[] => {
          if (
            typeof issue !== "object" ||
            issue === null ||
            !("message" in issue) ||
            typeof issue.message !== "string"
          ) {
            return [];
          }

          const field =
            "field" in issue && typeof issue.field === "string"
              ? `${issue.field}: `
              : "";
          return [`${field}${issue.message}`];
        })
      : [];

  return [message, ...details].filter(Boolean).join(" ") || undefined;
}

export default function ProjectCardActions({
  project,
}: ProjectCardActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status);
  const [pendingAction, setPendingAction] = useState<
    "update" | "delete" | null
  >(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  async function sendRequest(
    method: "PATCH" | "DELETE",
    body?: { name: string; description: string | null; status: string },
  ) {
    const response = await fetch(`/api/projects/${project.id}`, {
      method,
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      throw new Error("The server returned an unreadable response.");
    }

    if (!response.ok) {
      throw new Error(
        getResponseMessage(responseBody) ??
          `Unable to ${method === "PATCH" ? "update" : "delete"} the project.`,
      );
    }

    return getResponseMessage(responseBody);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("update");
    setMessage("");

    try {
      await sendRequest("PATCH", {
        name,
        description: description || null,
        status,
      });
      setMessage("Project updated successfully.");
      setMessageIsError(false);
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the project. Please try again.",
      );
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    setPendingAction("delete");
    setMessage("");

    try {
      const responseMessage = await sendRequest("DELETE");
      setMessage(responseMessage ?? "Project deleted successfully.");
      setMessageIsError(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the project. Please try again.",
      );
      setMessageIsError(true);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={`project-name-${project.id}`}
              className="block text-xs font-semibold text-slate-600"
            >
              Project name
            </label>
            <input
              id={`project-name-${project.id}`}
              name="name"
              type="text"
              required
              maxLength={150}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`project-description-${project.id}`}
              className="block text-xs font-semibold text-slate-600"
            >
              Description
            </label>
            <textarea
              id={`project-description-${project.id}`}
              name="description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`project-status-${project.id}`}
              className="block text-xs font-semibold text-slate-600"
            >
              Status
            </label>
            <select
              id={`project-status-${project.id}`}
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-indigo-100"
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pendingAction !== null}
              className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "update" ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => {
                setName(project.name);
                setDescription(project.description ?? "");
                setStatus(project.status);
                setIsEditing(false);
                setMessage("");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pendingAction !== null}
            onClick={() => {
              setMessage("");
              setIsEditing(true);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit project
          </button>
          <button
            type="button"
            disabled={pendingAction !== null}
            onClick={handleDelete}
            className="rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "delete" ? "Deleting..." : "Delete project"}
          </button>
        </div>
      )}

      {message ? (
        <p
          role={messageIsError ? "alert" : "status"}
          className={`mt-3 text-sm ${
            messageIsError ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
