import Link from "next/link";

type ProjectPaginationProps = {
  currentPage: number;
  totalPages: number;
};

export default function ProjectPagination({
  currentPage,
  totalPages,
}: ProjectPaginationProps) {
  return (
    <nav aria-label="Project pages">
      <p>
        Page {currentPage} of {totalPages}
      </p>

      <div>
        {currentPage > 1 ? (
          <Link href={`/projects?page=${currentPage - 1}`}>
            Previous
          </Link>
        ) : (
          <span aria-disabled="true">Previous</span>
        )}

        {currentPage < totalPages ? (
          <Link href={`/projects?page=${currentPage + 1}`}>
            Next
          </Link>
        ) : (
          <span aria-disabled="true">Next</span>
        )}
      </div>
    </nav>
  );
}