"use client";

import { useState } from "react";
import Link from "next/link";
import { Plane } from "lucide-react";
import { useDronesPaged, type DroneFilter } from "@/lib/queries";
import { DroneStatus } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ListCard } from "@/components/list-card";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { CreateDroneDialog } from "@/components/create-drone-dialog";
import { CreateDroneModelDialog } from "@/components/create-drone-model-dialog";

const filters = [
  { key: "all", label: "Të gjithë" },
  { key: DroneStatus.Available, label: "Të lirë" },
  { key: DroneStatus.InMission, label: "Në mision" },
  { key: DroneStatus.Maintenance, label: "Në servis" },
  { key: DroneStatus.Grounded, label: "Të ndaluar" },
];

export default function DronesPage() {
  const [filter, setFilter] = useState<DroneFilter>({ page: 1, pageSize: 25 });
  const [statusKey, setStatusKey] = useState("all");

  const { data, isLoading } = useDronesPaged(filter);

  const drones = data?.items ?? [];

  function changeStatus(key: string) {
    setStatusKey(key);
    setFilter((prev) => ({
      ...prev,
      status: key === "all" ? undefined : key,
      page: 1,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dronët" count={data?.totalCount ?? 0}>
        <SearchInput
          value={filter.search ?? ""}
          onChange={(v) =>
            setFilter((prev) => ({ ...prev, search: v || undefined, page: 1 }))
          }
          placeholder="Kërko dron..."
        />
        <CreateDroneModelDialog />
        <CreateDroneDialog />
      </PageHeader>

      <FilterBar options={filters} value={statusKey} onChange={changeStatus} />

      <ListCard
        isLoading={isLoading}
        isEmpty={drones.length === 0}
        emptyIcon={Plane}
        emptyText={
          filter.search
            ? "Asnjë dron nuk përputhet me kërkimin."
            : "Nuk ka dronë në këtë kategori."
        }
      >
        {drones.map((d) => (
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

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          onPageChange={(p) => setFilter((prev) => ({ ...prev, page: p }))}
          onPageSizeChange={(s) =>
            setFilter((prev) => ({ ...prev, pageSize: s, page: 1 }))
          }
          itemLabel="dronë"
        />
      )}
    </div>
  );
}