"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Info, OctagonAlert } from "lucide-react";
import {
  useAlertsPaged,
  useAcknowledgeAlert,
  useResolveAlert,
} from "@/lib/queries";
import { getApiError } from "@/lib/errors";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ListCard } from "@/components/list-card";
import { ErrorBanner } from "@/components/error-banner";
import { Pagination } from "@/components/pagination";
import { ActionButton } from "@/components/action-button";

const statusFilters = [
  { key: "Active", label: "Aktive" },
  { key: "Acknowledged", label: "Të pranuara" },
  { key: "Resolved", label: "Të zgjidhura" },
  { key: "all", label: "Të gjitha" },
];

const SEVERITY = {
  Critical: { label: "Kritik", color: "var(--status-warning)", icon: OctagonAlert },
  Warning: { label: "Paralajmërim", color: "var(--status-caution)", icon: AlertTriangle },
  Info: { label: "Info", color: "var(--status-clear)", icon: Info },
} as const;

const TYPE_LABELS: Record<string, string> = {
  LowBattery: "Bateri e ulët",
  CriticalBattery: "Bateri kritike",
  GpsWeak: "GPS i dobët",
  AltitudeExceeded: "Lartësi mbi kufi",
  HighVibration: "Dridhje të larta",
  GeofenceBreach: "Jashtë zonës",
  Proximity: "Afërsi dronësh",
};

function fmt(iso: string) {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)} ${iso.slice(11, 16)}Z`;
}

export default function AlertsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState("Active");
  const [severity, setSeverity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useAlertsPaged({
    page,
    pageSize,
    status: status === "all" ? undefined : status,
    severity: severity || undefined,
  });

  const ack = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  const alerts = data?.items ?? [];
  const critical = alerts.filter((a) => a.severity === "Critical").length;

  function run(
    m: typeof ack | typeof resolve,
    id: string,
    fallback: string
  ) {
    setError(null);
    m.mutate(id, { onError: (e) => setError(getApiError(e, fallback)) });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Alarmet" count={data?.totalCount ?? 0}>
        {critical > 0 && (
          <div className="flex items-center gap-2 text-[var(--status-warning)]">
            <OctagonAlert className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[13px]">{critical} kritike</span>
          </div>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <FilterBar
          options={statusFilters}
          value={status}
          onChange={(k) => {
            setStatus(k);
            setPage(1);
          }}
        />

        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(1);
          }}
          className="h-9 cursor-pointer rounded-md border bg-card px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted"
        >
          <option value="">Çdo nivel</option>
          <option value="Critical">Kritik</option>
          <option value="Warning">Paralajmërim</option>
          <option value="Info">Info</option>
        </select>
      </div>

      <ErrorBanner message={error} />

      <ListCard
        isLoading={isLoading}
        isEmpty={alerts.length === 0}
        emptyIcon={Bell}
        emptyText={
          status === "Active"
            ? "Asnjë alarm aktiv. Flota është në rregull."
            : "Nuk ka alarme në këtë kategori."
        }
      >
        {alerts.map((a) => {
          const sev = SEVERITY[a.severity as keyof typeof SEVERITY] ?? SEVERITY.Info;
          const Icon = sev.icon;
          const resolved = a.status === "Resolved";

          return (
            <div
              key={a.id}
              className="relative flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40"
            >
              {/* Shiriti i ashpërsisë */}
              <span
                className="absolute left-0 top-0 h-full w-[3px]"
                style={{
                  background: resolved ? "transparent" : sev.color,
                  opacity: a.status === "Acknowledged" ? 0.4 : 1,
                }}
              />

              <Icon
                className="h-4 w-4 shrink-0"
                strokeWidth={1.75}
                style={{ color: resolved ? "var(--muted-foreground)" : sev.color }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate text-[14px] font-medium ${
                      resolved ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {a.message}
                  </p>
                  {a.occurrenceCount > 1 && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                      ×{a.occurrenceCount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {TYPE_LABELS[a.alertType] ?? a.alertType}
                  {a.droneSerialNumber && ` · ${a.droneSerialNumber}`}
                </p>
              </div>

              <div className="hidden w-32 shrink-0 md:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Parë së fundi
                </p>
                <p className="font-mono text-[12px] tabular-nums">
                  {fmt(a.lastSeenAt ?? a.createdAt)}
                </p>
              </div>

              <div className="w-[108px] shrink-0">
                <span
                  className="inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                  style={{
                    color: sev.color,
                    borderColor: `color-mix(in oklab, ${sev.color} 35%, transparent)`,
                    background: `color-mix(in oklab, ${sev.color} 12%, transparent)`,
                  }}
                >
                  {sev.label}
                </span>
              </div>

              <div className="flex w-[180px] shrink-0 justify-end gap-1.5">
                {a.status === "Active" && (
                  <ActionButton
                    label="Prano"
                    tone="neutral"
                    width={74}
                    disabled={ack.isPending}
                    onClick={() => run(ack, a.id, "Pranimi dështoi.")}
                  />
                )}
                {!resolved && (
                  <ActionButton
                    label="Zgjidh"
                    width={74}
                    disabled={resolve.isPending}
                    onClick={() => run(resolve, a.id, "Mbyllja dështoi.")}
                  />
                )}
                {resolved && a.resolvedAt && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {fmt(a.resolvedAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </ListCard>

      {data && data.totalPages > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          itemLabel="alarme"
        />
      )}
    </div>
  );
}