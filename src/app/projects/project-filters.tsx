
type ProjectFiltersProps = {
  query: string;
  status?: string;
};

export default function ProjectFilters({
  query,
  status,
}: ProjectFiltersProps) {
  return (
    <form
      action="/projects"
      method="GET"
      className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="project-search"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
        Search projects
          </label>

          <input
            id="project-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name or description..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="sm:w-52">
          <label
            htmlFor="project-status"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
        Filter by status
          </label>

          <select
            id="project-status"
            name="status"
            defaultValue={status ?? "all"}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-indigo-100"
          >
            <option value="all">All statuses</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Apply filters
        </button>
      </div>
    </form>
  );
}
