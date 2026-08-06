"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Battery, Drone } from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BatteryMedium } from "lucide-react";

const statusFilters = [
  { key: "all", label: "Të gjitha" },
  { key: "Available", label: "Të lira" },
  { key: "InUse", label: "Në përdorim" },
  { key: "Charging", label: "Duke u karikuar" },
  { key: "NeedsReplacement", label: "Për zëvendësim" },
];

const statusOptions = [
  { value: "0", label: "E lirë" },
  { value: "1", label: "Në përdorim" },
  { value: "2", label: "Duke u karikuar" },
  { value: "3", label: "Për zëvendësim" },
];

function healthColor(h: number) {
  if (h < 70) return "var(--status-warning)";
  if (h < 85) return "var(--status-caution)";
  return "var(--status-clear)";
}

export default function BatteriesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["batteries"],
    queryFn: async () => (await api.get<Battery[]>("/batteries")).data,
  });

  const { data: drones } = useQuery({
    queryKey: ["drones"],
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["batteries"] });
    queryClient.invalidateQueries({ queryKey: ["drones"] });
  }

  const assign = useMutation({
    mutationFn: async ({ id, droneId }: { id: string; droneId: string | null }) =>
      api.post(`/batteries/${id}/assign`, { droneId }),
    onSuccess: () => {
      refresh();
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Caktimi dështoi.")),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: number }) =>
      api.patch(`/batteries/${id}/status`, { status }),
    onSuccess: () => {
      refresh();
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Statusi nuk u ndryshua.")),
  });

  const batteries = data ?? [];
  const visible =
    filter === "all" ? batteries : batteries.filter((b) => b.status === filter);

  const needsAttention = batteries.filter(
    (b) => b.healthPercentage < 80 || b.status === "NeedsReplacement"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold">Bateritë</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {batteries.length}
          </span>
        </div>

        {needsAttention > 0 && (
          <span className="text-[13px] text-[var(--status-caution)]">
            {needsAttention} kërkojnë vëmendje
          </span>
        )}
      </header>

      {/* Filtrat */}
      <div className="flex gap-1 rounded-lg border bg-card px-4 py-3">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${
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

      {/* Lista */}
      <div className="overflow-hidden rounded-lg border bg-card">
        {isLoading && (
          <p className="p-12 text-center text-[13px] text-muted-foreground">
            Duke ngarkuar...
          </p>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-16">
            <BatteryMedium
              className="h-8 w-8 text-muted-foreground/40"
              strokeWidth={1.5}
            />
            <p className="text-[13px] text-muted-foreground">
              Nuk ka bateri në këtë kategori.
            </p>
          </div>
        )}

        <div className="divide-y">
          {visible.map((b) => (
            <div key={b.id} className="flex items-center gap-6 px-6 py-4">
              {/* Identiteti dhe shendeti */}
              <div className="w-48 shrink-0">
                <p className="font-mono text-[13px] font-medium">{b.serialNumber}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${b.healthPercentage}%`,
                        background: healthColor(b.healthPercentage),
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {b.healthPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="hidden w-32 shrink-0 sm:block">
                <p className="font-mono text-[12px] tabular-nums">
                  {b.capacityMah} mAh
                </p>
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {b.cycleCount} cikle
                </p>
              </div>

              {/* Droni i caktuar */}
              <div className="min-w-0 flex-1">
                <Select
                  value={b.droneId ?? "none"}
                  onValueChange={(v) =>
                    assign.mutate({ id: b.id, droneId: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="h-8 w-full max-w-52 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pa dron</SelectItem>
                    {drones?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.serialNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statusi */}
              <div className="flex w-56 shrink-0 items-center justify-end gap-3">
                <StatusBadge status={b.status} />
                <Select
                  onValueChange={(v) =>
                    changeStatus.mutate({ id: b.id, status: Number(v) })
                  }
                >
                  <SelectTrigger className="h-8 w-36 text-[12px]">
                    <SelectValue placeholder="Ndrysho" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}