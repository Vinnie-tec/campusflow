"use client";

import { useMemo, useState } from "react";
import type { projects as projectsTable } from "@/lib/db/schema/projects";
import ProjectCardActions from "./project-card-actions";

type Project = typeof projectsTable.$inferSelect;

type ProjectListProps = {
  projects: Project[];
};

type StatusFilter = "all" | "planned" | "in-progress" | "completed";

export default function ProjectList({ projects }: ProjectListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Filter the projects whenever the search text, status, or data changes.
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        (project.description ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <section
      aria-labelledby="projects-heading"
      className="mx-auto max-w-5xl pb-12 sm:pb-16 lg:pb-20"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="projects-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            All projects
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Search, filter, and manage your projects.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600">
          {filteredProjects.length}{" "}
          {filteredProjects.length === 1 ? "project" : "projects"}
          {hasFilters ? ` of ${projects.length}` : ""}
        </span>
      </div>

      {/* Search and status filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="project-search"
            className="mb-1.5 block text-sm font-medium"
          >
            Search projects
          </label>

          <input
            id="project-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or description..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          />
        </div>

        <div className="sm:w-52">
          <label
            htmlFor="project-status-filter"
            className="mb-1.5 block text-sm font-medium"
          >
            Filter by status
          </label>

          <select
            id="project-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          >
            <option value="all">All statuses</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
          <p className="font-semibold text-slate-700">
            {projects.length === 0
              ? "No projects yet"
              : "No matching projects"}
          </p>

          <p className="mt-1.5 text-sm text-slate-500">
            {projects.length === 0
              ? "Create your first project using the form above."
              : "Try another search term or status filter."}
          </p>

          {projects.length > 0 && hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-4 text-sm font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filteredProjects.map((project) => (
            <li
              key={project.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="wrap-break-word font-semibold tracking-tight">
                  {project.name}
                </h3>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    project.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : project.status === "in-progress"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {project.status === "in-progress"
                    ? "In progress"
                    : project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
                {project.description || "No description provided."}
              </p>

              <ProjectCardActions project={project} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}