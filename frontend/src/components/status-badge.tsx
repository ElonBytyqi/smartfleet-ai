const variants: Record<string, string> = {
  Available: "border-[var(--status-clear)]/30 bg-[var(--status-clear)]/10 text-[var(--status-clear)]",
  Completed: "border-[var(--status-clear)]/30 bg-[var(--status-clear)]/10 text-[var(--status-clear)]",
  InMission: "border-primary/30 bg-primary/10 text-primary",
  InUse: "border-primary/30 bg-primary/10 text-primary",
  InProgress: "border-primary/30 bg-primary/10 text-primary",
  Approved: "border-primary/30 bg-primary/10 text-primary",
  Maintenance: "border-[var(--status-caution)]/30 bg-[var(--status-caution)]/10 text-[var(--status-caution)]",
  Charging: "border-[var(--status-caution)]/30 bg-[var(--status-caution)]/10 text-[var(--status-caution)]",
  Grounded: "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
  NeedsReplacement: "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
  Aborted: "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
  Planned: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-border bg-muted text-muted-foreground",
};

import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`font-mono text-[10px] font-normal uppercase tracking-wider ${variants[status] ?? ""}`}
    >
      {status}
    </Badge>
  );
}