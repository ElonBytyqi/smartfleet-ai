"use client";

import { useState } from "react";
import { BatteryMedium } from "lucide-react";
import {
  useBatteriesPaged,
  useDrones,
  useAssignBattery,
  useUpdateBatteryStatus,
  type BatteryFilter,
} from "@/lib/queries";
import { BatteryStatus, THRESHOLDS } from "@/lib/constants";
import { getApiError } from "@/lib/errors";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ListCard } from "@/components/list-card";
import { ErrorBanner } from "@/components/error-banner";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { CreateBatteryDialog } from "@/components/create-battery-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const filters = [
  { key: "all", label: "Të gjitha" },
  { key: BatteryStatus.Available, label: "Të lira" },
  { key: BatteryStatus.InUse, label: "Në përdorim" },
  { key: BatteryStatus.Charging, label: "Duke u karikuar" },
  { key: BatteryStatus.NeedsReplacement, label: "Për zëvendësim" },
];

// Vlerat numerike te enum-it ne backend
const statusOptions = [
  { value: "0", label: "E lirë" },
  { value: "1", label: "Në përdorim" },
  { value: "2", label: "Duke u karikuar" },
  { value: "3", label: "Për zëvendësim" },
];

function healthColor(h: number) {
  if (h < THRESHOLDS.batteryCritical) return "var(--status-warning)";
  if (h < 85) return "var(--status-caution)";
  return "var(--status-clear)";
}

export default function BatteriesPage() {
  const [filter, setFilter] = useState<BatteryFilter>({ page: 1, pageSize: 25 });
  const [statusKey, setStatusKey] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useBatteriesPaged(filter);
  const { data: drones } = useDrones();
  const assign = useAssignBattery();
  const changeStatus = useUpdateBatteryStatus();

  const batteries = data?.items ?? [];

  function changeFilter(key: string) {
    setStatusKey(key);
    setFilter((prev) => ({
      ...prev,
      status: key === "all" ? undefined : key,
      page: 1,
    }));
  }

  const needsAttention = batteries.filter(
    (b) =>
      b.healthPercentage < THRESHOLDS.batteryLow ||
      b.status === BatteryStatus.NeedsReplacement
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bateritë" count={data?.totalCount ?? 0}>
        {needsAttention > 0 && (
          <span className="text-[13px] text-[var(--status-caution)]">
            {needsAttention} kërkojnë vëmendje
          </span>
        )}
        <SearchInput
          value={filter.search ?? ""}
          onChange={(v) =>
            setFilter((prev) => ({ ...prev, search: v || undefined, page: 1 }))
          }
          placeholder="Kërko bateri..."
        />
        <CreateBatteryDialog />
      </PageHeader>

      <FilterBar options={filters} value={statusKey} onChange={changeFilter} />

      <ErrorBanner message={error} />

      <ListCard
        isLoading={isLoading}
        isEmpty={batteries.length === 0}
        emptyIcon={BatteryMedium}
        emptyText={
          filter.search
            ? "Asnjë bateri nuk përputhet me kërkimin."
            : "Nuk ka bateri në këtë kategori."
        }
      >
        {batteries.map((b) => (
          <div key={b.id} className="flex items-center gap-6 px-6 py-4">
            <div className="w-48 shrink-0">
              <p className="font-mono text-[13px] font-medium">{b.serialNumber}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
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

            <div className="min-w-0 flex-1">
              <Select
                value={b.droneId ?? "none"}
                onValueChange={(v) =>
                  assign.mutate(
                    { id: b.id, droneId: v === "none" ? null : v },
                    { onError: (e) => setError(getApiError(e, "Caktimi dështoi.")) }
                  )
                }
              >
                <SelectTrigger className="h-8 w-full max-w-52 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="none">Pa dron</SelectItem>
                  {drones?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.serialNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-56 shrink-0 items-center justify-end gap-3">
              <StatusBadge status={b.status} />
              <Select
                onValueChange={(v) =>
                  changeStatus.mutate(
                    { id: b.id, status: Number(v) },
                    {
                      onError: (e) =>
                        setError(getApiError(e, "Statusi nuk u ndryshua.")),
                    }
                  )
                }
              >
                <SelectTrigger className="h-8 w-36 text-[12px]">
                  <SelectValue placeholder="Ndrysho" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
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
          itemLabel="bateri"
        />
      )}
    </div>
  );
}