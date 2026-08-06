"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Mission } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { CreateMissionDialog } from "@/components/create-mission-dialog";
import { Button } from "@/components/ui/button";
import { Route } from "lucide-react";
import { getApiError } from "@/lib/errors";

const filters = [
  { key: "all", label: "Të gjitha" },
  { key: "Planned", label: "Të planifikuara" },
  { key: "Approved", label: "Të aprovuara" },
  { key: "InProgress", label: "Në progres" },
  { key: "Completed", label: "Të përfunduara" },
];

const actions: Record<string, { label: string; path: string }[]> = {
  Planned: [
    { label: "Aprovo", path: "approve" },
    { label: "Anulo", path: "cancel" },
  ],
  Approved: [
    { label: "Nis", path: "start" },
    { label: "Anulo", path: "cancel" },
  ],
  InProgress: [
    { label: "Përfundo", path: "complete" },
    { label: "Ndërprit", path: "abort" },
  ],
};

export default function MissionsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => (await api.get<Mission[]>("/missions")).data,
  });

  const action = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) =>
      api.post(`/missions/${id}/${path}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["drones"] });
      queryClient.invalidateQueries({ queryKey: ["batteries"] });
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Veprimi nuk u krye.")),
  });

  const visible =
    filter === "all" ? data : data?.filter((m) => m.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold">Misionet</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {data?.length ?? 0}
          </span>
        </div>
        <CreateMissionDialog />
      </header>

      {/* Filtrat */}
      <div className="flex gap-1 rounded-lg border bg-card px-4 py-3">
        {filters.map((f) => (
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

        {!isLoading && visible?.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-16">
            <Route className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-[13px] text-muted-foreground">
              Nuk ka misione në këtë kategori.
            </p>
          </div>
        )}

        <div className="divide-y">
          {visible?.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40"
            >
              {/* Titulli */}
              <Link href={`/missions/${m.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-medium hover:text-primary">
                    {m.title}
                  </p>
                  {!m.isAutonomous && (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      pilot
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {m.missionType} · {m.flightZoneName} · {m.waypointCount} pika
                </p>
              </Link>

              {/* Burimet */}
              <div className="hidden w-36 shrink-0 sm:block">
                <p className="font-mono text-[12px]">
                  {m.droneSerialNumber ?? (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {m.batterySerialNumber ?? (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </p>
              </div>

              {/* Data */}
              <div className="hidden w-28 shrink-0 md:block">
                <p className="font-mono text-[12px] tabular-nums">
                  {m.scheduledStart.slice(8, 10)}.{m.scheduledStart.slice(5, 7)}.
                  {m.scheduledStart.slice(0, 4)}
                </p>
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {m.scheduledStart.slice(11, 16)}Z
                </p>
              </div>

              {/* Statusi */}
              <div className="shrink-0">
                <StatusBadge status={m.status} />
              </div>

              {/* Veprimet — gjeresi fikse edhe kur s'ka butona */}
              <div className="flex w-[156px] shrink-0 justify-end gap-1.5">
                {actions[m.status]?.map((a) => (
                  <Button
                    key={a.path}
                    variant="outline"
                    size="sm"
                    className="h-7 w-[74px] px-0 text-[12px]"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ id: m.id, path: a.path })}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}