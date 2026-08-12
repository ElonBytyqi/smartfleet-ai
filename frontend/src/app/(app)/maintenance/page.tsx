"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MaintenanceRecord } from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { StatusBadge } from "@/components/status-badge";
import { CreateMaintenanceDialog } from "@/components/create-maintenance-dialog";
import { CompleteMaintenanceDialog } from "@/components/complete-maintenance-dialog";
import { Wrench } from "lucide-react";

const filters = [
  { key: "all", label: "Të gjitha" },
  { key: "Scheduled", label: "Të planifikuara" },
  { key: "InProgress", label: "Në progres" },
  { key: "Completed", label: "Të përfunduara" },
];

const typeLabels: Record<string, string> = {
  Scheduled: "E planifikuar",
  Corrective: "Riparim",
  Predictive: "Parandaluese",
};

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<MaintenanceRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () =>
      (await api.get<MaintenanceRecord[]>("/maintenance")).data,
  });

  const start = useMutation({
    mutationFn: async (id: string) => api.post(`/maintenance/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["drones"] });
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Puna nuk u nis.")),
  });

  const records = data ?? [];
  const visible =
    filter === "all" ? records : records.filter((r) => r.status === filter);

  const inProgress = records.filter((r) => r.status === "InProgress").length;
  const totalCost = records
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => sum + (r.cost ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between  rounded-lg border bg-card px-6 py-4 ">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold ">Mirëmbajtja</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {records.length}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {inProgress > 0 && (
            <span className="text-[13px] text-[var(--status-caution)]">
              {inProgress} në progres
            </span>
          )}
          <span className="font-mono text-[12px] text-muted-foreground">
            {totalCost.toFixed(2)} € gjithsej
          </span>
          <CreateMaintenanceDialog />
        </div>
      </header>

      <div className="flex gap-1 rounded-lg border bg-card px-4 py-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-[13px] transition-colors ${
              filter === f.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 px-6 py-3">
          <p className="text-[13px] text-[var(--status-warning)]">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        {isLoading && (
          <p className="p-12 text-center text-[13px] text-muted-foreground">
            Duke ngarkuar...
          </p>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-16">
            <Wrench className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-[13px] text-muted-foreground">
              Nuk ka punë në këtë kategori.
            </p>
          </div>
        )}

        <div className="divide-y">
          {visible.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{r.description}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {typeLabels[r.maintenanceType] ?? r.maintenanceType}
                  {r.componentType && ` · ${r.componentType}`}
                  {r.technicianName && ` · ${r.technicianName}`}
                </p>
              </div>

              <div className="hidden w-36 shrink-0 sm:block">
                <p className="font-mono text-[12px]">{r.droneSerialNumber}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {r.droneNickname ?? "—"}
                </p>
              </div>

              <div className="hidden w-28 shrink-0 md:block">
                <p className="font-mono text-[12px] tabular-nums">
                  {r.performedAt.slice(0, 10)}
                </p>
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {r.nextRecommendedDate
                    ? `→ ${r.nextRecommendedDate}`
                    : "—"}
                </p>
              </div>

              <div className="hidden w-20 shrink-0 text-right lg:block">
                <p className="font-mono text-[12px] tabular-nums">
                  {r.cost !== null ? `${r.cost.toFixed(2)} €` : "—"}
                </p>
              </div>

              <div className="shrink-0">
                <StatusBadge status={r.status} />
              </div>

              <div className="flex w-[100px] shrink-0 justify-end">
                {r.status === "Scheduled" && (
                  <button
                    disabled={start.isPending}
                    onClick={() => start.mutate(r.id)}
                    className="h-7 w-[88px] cursor-pointer rounded-md border border-transparent bg-primary text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    Nis punën
                  </button>
                )}
                {r.status === "InProgress" && (
                  <button
                    onClick={() => setCompleting(r)}
                    className="h-7 w-[88px] cursor-pointer rounded-md border border-transparent bg-primary text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Mbyll
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CompleteMaintenanceDialog
        record={completing}
        onClose={() => setCompleting(null)}
      />
    </div>
  );
}