import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "rreshta",
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
}) {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Numrat e faqeve rreth asaj aktuale
  const pages: (number | "gap")[] = [];
  const window = 1;

  for (let i = 1; i <= totalPages; i++) {
    const near = Math.abs(i - page) <= window;
    const edge = i === 1 || i === totalPages;

    if (near || edge) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  const btn =
    "flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2 text-[12px] transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-5 py-3">
      <p className="font-mono text-[12px] text-muted-foreground">
        {from}–{to} nga {totalCount} {itemLabel}
      </p>

      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 cursor-pointer rounded-md border border-border bg-card px-2 text-[12px] text-foreground outline-none transition-colors hover:bg-muted focus:border-primary/50"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n} className="bg-card text-foreground">
                {n} për faqe
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-1">
          <button
            className={btn}
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            aria-label="Faqja e parë"
          >
            <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <button
            className={btn}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Faqja e mëparshme"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          {pages.map((p, i) =>
            p === "gap" ? (
              <span
                key={`gap-${i}`}
                className="flex h-8 w-6 items-center justify-center text-[12px] text-muted-foreground"
              >
                ·
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`${btn} ${
                  p === page ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90" : ""
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            className={btn}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Faqja tjetër"
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <button
            className={btn}
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            aria-label="Faqja e fundit"
          >
            <ChevronsRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}