import { Badge } from "@/components/ui/badge";

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
  Aborted: "border-[var(--status-warning)]/20 bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
  Planned: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-[var(--status-warning)]/80 bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
Scheduled: "border-[#4a6fa5]/40 bg-[#4a6fa5]/12 text-[#6b8fc7]",};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex h-[22px] w-[100px] items-center justify-center rounded-full border font-mono text-[10px] uppercase tracking-wider ${
        variants[status] ?? "border-border bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}