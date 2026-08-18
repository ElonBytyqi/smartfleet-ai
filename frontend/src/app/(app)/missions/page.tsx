"use client";

import { useState } from "react";
import Link from "next/link";
import { Route } from "lucide-react";
import { useMissions, useMissionAction } from "@/lib/queries";
import { MissionStatus, TYPE_LABELS } from "@/lib/constants";
import { getApiError } from "@/lib/errors";
import { StatusBadge } from "@/components/status-badge";
import { CreateMissionDialog } from "@/components/create-mission-dialog";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ListCard } from "@/components/list-card";
import { ErrorBanner } from "@/components/error-banner";
import { ActionButton } from "@/components/action-button";

const filters = [
  { key: "all", label: "Të gjitha" },
  { key: MissionStatus.Planned, label: "Të planifikuara" },
  { key: MissionStatus.Approved, label: "Të aprovuara" },
  { key: MissionStatus.InProgress, label: "Në progres" },
  { key: MissionStatus.Completed, label: "Të përfunduara" },
];


const actions: Record<string, { label: string; path: string; tone: "primary" | "danger" }[]> = {
 [MissionStatus.Planned]: [
    { label: "Aprovo", path: "approve", tone: "primary" },
    { label: "Anulo", path: "cancel", tone: "danger" },
  ],
  [MissionStatus.Approved]: [
    { label: "Nis", path: "start", tone: "primary" },
    { label: "Anulo", path: "cancel", tone: "danger" },
  ],
  [MissionStatus.InProgress]: [
    { label: "Përfundo", path: "complete", tone: "primary" },
    { label: "Ndërprit", path: "abort", tone: "danger" },
  ],
};


export default function MissionsPage() {
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useMissions();
  const action = useMissionAction();

  function run(id: string, path: string) {
    setError(null);
    action.mutate(
      { id, action: path },
      { onError: (err) => setError(getApiError(err, "Veprimi nuk u krye.")) }
    );
  }

  const visible =
    filter === "all" ? data : data?.filter((m) => m.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Misionet" count={data?.length ?? 0}>
        <CreateMissionDialog />
      </PageHeader>

      <FilterBar options={filters} value={filter} onChange={setFilter} />

      <ErrorBanner message={error} />

      <ListCard
        isLoading={isLoading}
        isEmpty={visible?.length === 0}
        emptyIcon={Route}
        emptyText="Nuk ka misione në këtë kategori."
      >
        {visible?.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40"
          >
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
                {TYPE_LABELS[m.missionType] ?? m.missionType} · {m.flightZoneName} ·{" "}
                {m.waypointCount} pika
              </p>
            </Link>

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

            <div className="hidden w-28 shrink-0 md:block">
              <p className="font-mono text-[12px] tabular-nums">
                {m.scheduledStart.slice(8, 10)}.{m.scheduledStart.slice(5, 7)}.
                {m.scheduledStart.slice(0, 4)}
              </p>
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {m.scheduledStart.slice(11, 16)}Z
              </p>
            </div>

            <div className="shrink-0">
              <StatusBadge status={m.status} />
            </div>

            <div className="flex w-[156px] shrink-0 justify-end gap-1.5">
              {actions[m.status]?.map((a) => (
                <ActionButton
                  key={a.path}
                  label={a.label}
                  tone={a.tone}
                  disabled={action.isPending}
                  onClick={() => run(m.id, a.path)}
                />
              ))}
            </div>
          </div>
        ))}
      </ListCard>
    </div>
  );
}