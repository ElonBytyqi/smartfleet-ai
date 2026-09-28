"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import {
  useMaintenancePaged,
  useStartMaintenance,
  type MaintenanceFilter,
} from "@/lib/queries";
import { MaintenanceStatus } from "@/lib/constants";
import { getApiError } from "@/lib/errors";
import { MaintenanceRecord } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { CreateMaintenanceDialog } from "@/components/create-maintenance-dialog";
import { CompleteMaintenanceDialog } from "@/components/complete-maintenance-dialog";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ListCard } from "@/components/list-card";
import { ErrorBanner } from "@/components/error-banner";
import { ActionButton } from "@/components/action-button";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";

const filters = [
  { key: "all", label: "Të gjitha" },
  { key: MaintenanceStatus.Scheduled, label: "Të planifikuara" },
  { key: MaintenanceStatus.InProgress, label: "Në progres" },
  { key: MaintenanceStatus.Completed, label: "Të përfunduara" },
];

const typeLabels: Record<string, string> = {
  Scheduled: "E planifikuar",
  Corrective: "Riparim",
  Predictive: "Parandaluese",
};

export default function MaintenancePage() {
  const [filter, setFilter] = useState<MaintenanceFilter>({ page: 1, pageSize: 25 });
  const [statusKey, setStatusKey] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<MaintenanceRecord | null>(null);

  const { data, isLoading } = useMaintenancePaged(filter);
  const start = useStartMaintenance();

  const records = data?.items ?? [];

  function changeStatus(key: string) {
    setStatusKey(key);
    setFilter((prev) => ({
      ...prev,
      status: key === "all" ? undefined : key,
      page: 1,
    }));
  }

  const inProgress = records.filter(
    (r) => r.status === MaintenanceStatus.InProgress
  ).length;

  // Kostoja e faqes aktuale — jo e gjithe historise
  const pageCost = records
    .filter((r) => r.status === MaintenanceStatus.Completed)
    .reduce((sum, r) => sum + (r.cost ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mirëmbajtja" count={data?.totalCount ?? 0}>
        {inProgress > 0 && (
          <span className="text-[13px] text-[var(--status-caution)]">
            {inProgress} në progres
          </span>
        )}
        <span className="font-mono text-[12px] text-muted-foreground">
          {pageCost.toFixed(2)} € në këtë faqe
        </span>
        <SearchInput
          value={filter.search ?? ""}
          onChange={(v) =>
            setFilter((prev) => ({ ...prev, search: v || undefined, page: 1 }))
          }
          placeholder="Kërko punë..."
        />
        <CreateMaintenanceDialog />
      </PageHeader>

      <FilterBar options={filters} value={statusKey} onChange={changeStatus} />

      <ErrorBanner message={error} />

      <ListCard
        isLoading={isLoading}
        isEmpty={records.length === 0}
        emptyIcon={Wrench}
        emptyText={
          filter.search
            ? "Asnjë punë nuk përputhet me kërkimin."
            : "Nuk ka punë në këtë kategori."
        }
      >
        {records.map((r) => (
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
                {r.nextRecommendedDate ? `→ ${r.nextRecommendedDate}` : "—"}
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
              {r.status === MaintenanceStatus.Scheduled && (
                <ActionButton
                  label="Nis punën"
                  width={88}
                  disabled={start.isPending}
                  onClick={() =>
                    start.mutate(r.id, {
                      onError: (e) =>
                        setError(getApiError(e, "Puna nuk u nis.")),
                    })
                  }
                />
              )}
              {r.status === MaintenanceStatus.InProgress && (
                <ActionButton
                  label="Mbyll"
                  width={88}
                  onClick={() => setCompleting(r)}
                />
              )}
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
          itemLabel="punë"
        />
      )}

      <CompleteMaintenanceDialog
        record={completing}
        onClose={() => setCompleting(null)}
      />
    </div>
  );
}