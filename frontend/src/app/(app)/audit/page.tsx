"use client";

import { useState } from "react";
import {
  History,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAuditLogs, useAuditEntityTypes, type AuditFilter } from "@/lib/queries/audit";
import {
  Role,
  AUDIT_ACTIONS,
  ACTION_LABELS,
  ENTITY_LABELS,
  FIELD_LABELS,
} from "@/lib/constants";
import { AuditLog } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { ListCard } from "@/components/list-card";
import { RoleGuard } from "@/components/role-guard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACTION_STYLE: Record<
  string,
  { color: string; icon: typeof Plus }
> = {
  Created: { color: "var(--status-clear)", icon: Plus },
  Updated: { color: "#6b8fc7", icon: Pencil },
  Deleted: { color: "var(--status-warning)", icon: Trash2 },
};

type Change = { from?: string | null; to?: string | null };

function ChangeList({ json }: { json: string }) {
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  const entries = Object.entries(parsed);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5 border-t pt-3">
      {entries.map(([field, value]) => {
        const label = FIELD_LABELS[field] ?? field;

        // Perditesim: {from, to}
        if (value && typeof value === "object" && "to" in (value as object)) {
          const c = value as Change;
          return (
            <div key={field} className="flex flex-wrap items-baseline gap-2 text-[12px]">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono text-muted-foreground/60 line-through">
                {c.from ?? "—"}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-mono">{c.to ?? "—"}</span>
            </div>
          );
        }

        // Krijim ose fshirje: vlere e vetme
        return (
          <div key={field} className="flex flex-wrap items-baseline gap-2 text-[12px]">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono">{String(value ?? "—")}</span>
          </div>
        );
      })}
    </div>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);

  const style = ACTION_STYLE[log.action] ?? ACTION_STYLE.Updated;
  const Icon = style.icon;
  const hasChanges = !!log.changes;

  return (
    <div>
      <button
        onClick={() => hasChanges && setOpen((o) => !o)}
        disabled={!hasChanges}
        className={`flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors ${
          hasChanges ? "cursor-pointer hover:bg-muted/40" : "cursor-default"
        }`}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `color-mix(in oklab, ${style.color} 14%, transparent)`,
          }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: style.color }} strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px]">
            <span style={{ color: style.color }}>
              {ACTION_LABELS[log.action] ?? log.action}
            </span>{" "}
            <span className="text-muted-foreground">
              {ENTITY_LABELS[log.entityType] ?? log.entityType}
            </span>
            {log.entityLabel && (
              <span className="font-mono"> · {log.entityLabel}</span>
            )}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {log.userEmail ?? "sistemi"}
            {log.ipAddress && ` · ${log.ipAddress}`}
          </p>
        </div>

        <div className="hidden w-32 shrink-0 text-right md:block">
          <p className="font-mono text-[12px] tabular-nums">
            {log.createdAt.slice(0, 10)}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {log.createdAt.slice(11, 19)}Z
          </p>
        </div>

        {hasChanges && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
        )}
      </button>

      {open && log.changes && (
        <div className="border-t bg-muted/20 px-6 pb-4 pt-1">
          <ChangeList json={log.changes} />
        </div>
      )}
    </div>
  );
}

function AuditContent() {
  const [filter, setFilter] = useState<AuditFilter>({ page: 1, pageSize: 30 });

  const { data, isLoading } = useAuditLogs(filter);
  const { data: entityTypes } = useAuditEntityTypes();

  const logs = data?.items ?? [];

  function update(patch: Partial<AuditFilter>) {
    setFilter((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Regjistri i veprimeve" count={data?.totalCount ?? 0} />

      {/* Filtrat */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <Select
          value={filter.entityType ?? "all"}
          onValueChange={(v) => update({ entityType: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-8 w-48 text-[12px]">
            <SelectValue placeholder="Entiteti" />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            <SelectItem value="all">Të gjitha entitetet</SelectItem>
            {entityTypes?.map((t) => (
              <SelectItem key={t} value={t}>
                {ENTITY_LABELS[t] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.action ?? "all"}
          onValueChange={(v) => update({ action: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-8 w-40 text-[12px]">
            <SelectValue placeholder="Veprimi" />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            <SelectItem value="all">Të gjitha veprimet</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="date"
          value={filter.from?.slice(0, 10) ?? ""}
          onChange={(e) =>
            update({ from: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })
          }
          className="h-8 rounded-md border border-border bg-transparent px-2.5 text-[12px]"
        />

        <span className="text-[12px] text-muted-foreground">deri</span>

        <input
          type="date"
          value={filter.to?.slice(0, 10) ?? ""}
          onChange={(e) =>
            update({ to: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })
          }
          className="h-8 rounded-md border border-border bg-transparent px-2.5 text-[12px]"
        />

        {(filter.entityType || filter.action || filter.from || filter.to) && (
          <button
            onClick={() => setFilter({ page: 1, pageSize: 30 })}
            className="ml-auto cursor-pointer text-[12px] text-muted-foreground transition-colors hover:text-primary"
          >
            Pastro filtrat
          </button>
        )}
      </div>

      <ListCard
        isLoading={isLoading}
        isEmpty={logs.length === 0}
        emptyIcon={History}
        emptyText="Nuk ka veprime të regjistruara."
      >
        {logs.map((log) => (
          <LogRow key={log.id} log={log} />
        ))}
      </ListCard>

      {/* Faqosja */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-6 py-3">
          <p className="font-mono text-[12px] text-muted-foreground">
            Faqja {data.page} nga {data.totalPages} · {data.totalCount} veprime
          </p>

          <div className="flex gap-1">
            <button
              onClick={() => update({ page: data.page - 1 })}
              disabled={data.page <= 1}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => update({ page: data.page + 1 })}
              disabled={data.page >= data.totalPages}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <RoleGuard roles={[Role.Admin]}>
      <AuditContent />
    </RoleGuard>
  );
}