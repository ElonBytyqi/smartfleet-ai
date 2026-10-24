"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, BarChart3 } from "lucide-react";
import { useReport, downloadReport, type ReportFilter } from "@/lib/queries/reports";
import { getApiError } from "@/lib/errors";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ErrorBanner } from "@/components/error-banner";
import { Skeleton } from "@/components/skeleton";

const types = [
  { key: "Missions", label: "Misionet" },
  { key: "Drones", label: "Flota" },
  { key: "Batteries", label: "Bateritë" },
  { key: "Maintenance", label: "Mirëmbajtja" },
  { key: "Costs", label: "Kostot" },
  { key: "FlightHours", label: "Orët e fluturimit" },
];

export default function ReportsPage() {
  const [type, setType] = useState("Missions");
  const [filter, setFilter] = useState<ReportFilter>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useReport(type, filter);

  async function download(format: "pdf" | "excel") {
    setBusy(format);
    setError(null);
    try {
      await downloadReport(type, format, filter);
    } catch (e) {
      setError(getApiError(e, "Shkarkimi dështoi."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Raportet" count={data?.rows.length ?? 0}>
        <button
          onClick={() => download("excel")}
          disabled={busy !== null}
          className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={2} />
          {busy === "excel" ? "Duke përgatitur..." : "Excel"}
        </button>
        <button
          onClick={() => download("pdf")}
          disabled={busy !== null}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={2} />
          {busy === "pdf" ? "Duke përgatitur..." : "PDF"}
        </button>
      </PageHeader>

      <FilterBar options={types} value={type} onChange={setType} />

      {/* Periudha */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card px-6 py-4">
        <div className="space-y-1.5">
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Nga data
          </label>
          <input
            type="date"
            value={filter.from ?? ""}
            onChange={(e) =>
              setFilter((p) => ({ ...p, from: e.target.value || undefined }))
            }
            className="h-9 rounded-md border bg-background px-3 font-mono text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Deri më
          </label>
          <input
            type="date"
            value={filter.to ?? ""}
            onChange={(e) =>
              setFilter((p) => ({ ...p, to: e.target.value || undefined }))
            }
            className="h-9 rounded-md border bg-background px-3 font-mono text-[13px]"
          />
        </div>

        {(filter.from || filter.to) && (
          <button
            onClick={() => setFilter({})}
            className="h-9 cursor-pointer px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Pastro
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {data && (
        <>
          {/* Përmbledhja */}
          {data.summary.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {data.summary.map((s) => (
                <div key={s.label} className="rounded-lg border bg-card px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tabela */}
          <div className="overflow-hidden rounded-lg border bg-card">
            {data.rows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-16">
                <BarChart3
                  className="h-8 w-8 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
                <p className="text-[13px] text-muted-foreground">
                  Nuk ka të dhëna për këtë periudhë.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {data.columns.map((c) => (
                        <th
                          key={c}
                          className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.rows.map((row, i) => (
                      <tr key={i} className="transition-colors hover:bg-muted/40">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`px-4 py-2.5 text-[13px] ${
                              j === 0 ? "font-medium" : "text-muted-foreground"
                            } ${/^[\d.,\s€%h-]+$/.test(cell) ? "font-mono tabular-nums" : ""}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}