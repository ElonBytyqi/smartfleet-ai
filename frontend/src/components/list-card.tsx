import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export function ListCard({
  isLoading,
  isEmpty,
  emptyIcon: EmptyIcon,
  emptyText,
  emptyHint,
  children,
}: {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: LucideIcon;
  emptyText?: string;
  emptyHint?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {isLoading && (
        <p className="p-12 text-center text-[13px] text-muted-foreground">
          Duke ngarkuar...
        </p>
      )}

      {!isLoading && isEmpty && (
        <div className="flex flex-col items-center gap-3 p-16 text-center">
          {EmptyIcon && (
            <EmptyIcon className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          )}
          <p className="text-[13px] text-muted-foreground">
            {emptyText ?? "Nuk ka të dhëna."}
          </p>
          {emptyHint && (
            <p className="font-mono text-[11px] text-muted-foreground/70">
              {emptyHint}
            </p>
          )}
        </div>
      )}

      {!isLoading && !isEmpty && <div className="divide-y">{children}</div>}
    </div>
  );
}