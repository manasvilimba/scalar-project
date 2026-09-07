"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const btnBase =
    "h-7 px-2.5 text-xs rounded border border-[var(--aws-border)] bg-[var(--aws-surface)] text-[var(--aws-text)] hover:bg-[var(--aws-surface-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors";

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-[var(--aws-border)] text-xs text-[var(--aws-text-muted)]">
      {/* Count */}
      <span>
        {total === 0
          ? "No results"
          : `${start}–${end} of ${total}`}
      </span>

      <div className="flex items-center gap-3">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-7 pl-2 pr-6 text-xs rounded border border-[var(--aws-border)] bg-[var(--aws-surface)] text-[var(--aws-text)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--aws-border-focus)]"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            className={btnBase}
            disabled={page === 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            «
          </button>
          <button
            className={btnBase}
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="px-2 font-medium text-[var(--aws-text)]">
            {page} / {totalPages}
          </span>
          <button
            className={btnBase}
            disabled={page === totalPages || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            ›
          </button>
          <button
            className={btnBase}
            disabled={page === totalPages || totalPages === 0}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
