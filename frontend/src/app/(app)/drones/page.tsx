"use client";

import Link from "next/link";
import { useState } from "react";
import { Plane } from "lucide-react";
import { useDrones } from "@/lib/queries";
import { DroneStatus } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ListCard } from "@/components/list-card";

const filters = [
  { key: "all", label: "Të gjithë" },
  { key: DroneStatus.Available, label: "Të lirë" },
  { key: DroneStatus.InMission, label: "Në mision" },
  { key: DroneStatus.Maintenance, label: "Në servis" },
  { key: DroneStatus.Grounded, label: "Të ndaluar" },
];

export default function DronesPage() {
  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useDrones();

  const drones = data ?? [];
  const visible =
    filter === "all" ? drones : drones.filter((d) => d.status === filter);

  const totalHours = drones.reduce((sum, d) => sum + d.totalFlightHours, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dronët" count={drones.length}>
        <span className="font-mono text-[12px] text-muted-foreground">
          {totalHours.toFixed(0)} orë fluturimi gjithsej
        </span>
      </PageHeader>

      <FilterBar options={filters} value={filter} onChange={setFilter} />

      <ListCard
        isLoading={isLoading}
        isEmpty={visible.length === 0}
        emptyIcon={Plane}
        emptyText="Nuk ka dronë në këtë kategori."
      >
        {visible.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40"
          >
            <Link href={`/drones/${d.id}`} className="min-w-0 flex-1">
              <p className="truncate font-mono text-[14px] font-medium hover:text-primary">
                {d.serialNumber}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {d.nickname ?? "—"}
                {d.modelName && ` · ${d.modelName}`}
              </p>
            </Link>

            <div className="hidden w-32 shrink-0 md:block">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Blerë
              </p>
              <p className="font-mono text-[12px] tabular-nums">
                {d.purchaseDate ?? "—"}
              </p>
            </div>

            <div className="w-24 shrink-0 text-right">
              <p className="font-mono text-[14px] tabular-nums">
                {d.totalFlightHours.toFixed(1)}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                orë
              </p>
            </div>

            <div className="shrink-0">
              <StatusBadge status={d.status} />
            </div>
          </div>
        ))}
      </ListCard>
    </div>
  );
}