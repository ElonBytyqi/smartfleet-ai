import { ReactNode } from "react";

export function PageHeader({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
      <div className="flex items-baseline gap-3">
        <h1 className="font-heading text-base font-semibold">{title}</h1>
        {count !== undefined && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children && <div className="flex items-center gap-6">{children}</div>}
    </header>
  );
}