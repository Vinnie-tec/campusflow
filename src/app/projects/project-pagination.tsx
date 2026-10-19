import Link from "next/link";

type ProjectPaginationProps = {
  currentPage: number;
  totalPages: number;
  query: string;
  status?: string;
};

export default function ProjectPagination({
  currentPage,
  totalPages,
  query,
  status,
}: ProjectPaginationProps) {
  function pageHref(page: number) {
    const params = new URLSearchParams();

    params.set("page", String(page));

    if (query) {
      params.set("q", query);
    }

    if (status) {
      params.set("status", status);
    }

    return `/projects?${params.toString()}`;
  }
  return (
    <nav
      aria-label="Project pages"
      className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-5 sm:flex-row"
    >
      <p className="text-sm font-medium text-slate-500">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={pageHref(currentPage - 1)}
            rel="prev"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            Previous
          </span>
        )}

        {currentPage < totalPages ? (
          <Link
            href={pageHref(currentPage + 1)}
            rel="next"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
