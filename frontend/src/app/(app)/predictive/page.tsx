"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  Wrench,
  ChevronDown,
  Activity,
} from "lucide-react";
import { useFleetRisk, useRefreshFleetRisk, useAiHealth } from "@/lib/queries/ai";
import { DroneRisk } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { ListCard } from "@/components/list-card";
import { CreateMaintenanceDialog } from "@/components/create-maintenance-dialog";

const LEVEL_STYLES: Record<string, { color: string; label: string }> = {
  Critical: { color: "var(--status-warning)", label: "Kritik" },
  High: { color: "var(--status-warning)", label: "I lartë" },
  Medium: { color: "var(--status-caution)", label: "Mesatar" },
  Low: { color: "var(--status-clear)", label: "I ulët" },
};

function RiskGauge({ score, level }: { score: number; level: string }) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.Low;
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg className="absolute -rotate-90" width="64" height="64">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={style.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <span
        className="font-mono text-[15px] font-medium tabular-nums"
        style={{ color: style.color }}
      >
        {score.toFixed(0)}
      </span>
    </div>
  );
}

function DroneRiskRow({ risk }: { risk: DroneRisk }) {
  const [open, setOpen] = useState(false);
  const style = LEVEL_STYLES[risk.riskLevel] ?? LEVEL_STYLES.Low;

  // Faktorët renditur sipas kontributit real
  const ranked = [...risk.factors].sort(
    (a, b) => b.score * b.weight - a.score * a.weight
  );

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-5 px-6 py-4 text-left transition-colors hover:bg-muted/40"
      >
        <RiskGauge score={risk.riskScore} level={risk.riskLevel} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[14px] font-medium">
              {risk.serialNumber}
            </p>
            <span
              className="rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
              style={{
                color: style.color,
                borderColor: `color-mix(in oklab, ${style.color} 35%, transparent)`,
                background: `color-mix(in oklab, ${style.color} 12%, transparent)`,
              }}
            >
              {style.label}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {risk.nickname ?? "—"} · {risk.modelName}
          </p>
          <p className="mt-1 text-[13px]">{risk.recommendedAction}</p>
        </div>

        <div className="hidden w-40 shrink-0 lg:block">
          {risk.likelyComponent && (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Komponenti
              </p>
              <p className="mt-0.5 text-[12px]">{risk.likelyComponent}</p>
            </>
          )}
        </div>

        <div className="hidden w-28 shrink-0 text-right md:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Inspektim
          </p>
          <p className="mt-0.5 font-mono text-[13px] tabular-nums">
            {risk.recommendedInspectionDays === 0
              ? "menjëherë"
              : `${risk.recommendedInspectionDays} ditë`}
          </p>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {/* Faktorët */}
      {open && (
        <div className="border-t bg-muted/20 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Faktorët e vlerësimit
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {risk.telemetryPoints > 0
                ? `${risk.telemetryPoints.toLocaleString()} pika telemetrie`
                : "pa telemetri"}
            </p>
          </div>

          <div className="space-y-3">
            {ranked.map((f) => (
              <div key={f.name}>
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <span className="text-[13px]">{f.name}</span>
                  <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
                    {f.value}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${f.score}%`,
                        background:
                          f.score >= 70
                            ? "var(--status-warning)"
                            : f.score >= 40
                              ? "var(--status-caution)"
                              : "var(--status-clear)",
                      }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                    peshë {f.weight}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <Link
              href={`/drones/${risk.droneId}`}
              className="text-[12px] text-muted-foreground transition-colors hover:text-primary"
            >
              Shiko dronin
            </Link>
            <p className="font-mono text-[11px] text-muted-foreground">
              Vlerësuar {risk.assessedAt.slice(0, 16).replace("T", " ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PredictivePage() {
  const { data, isLoading, isError } = useFleetRisk();
  const refresh = useRefreshFleetRisk();
  const { data: health } = useAiHealth();

  const risks = data ?? [];
  const critical = risks.filter((r) =>
    ["Critical", "High"].includes(r.riskLevel)
  ).length;

  const avgScore =
    risks.length > 0
      ? risks.reduce((s, r) => s + r.riskScore, 0) / risks.length
      : 0;

  if (isError || health?.available === false) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Parashikimi i mirëmbajtjes" />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-16 text-center">
          <Brain className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">
            Shërbimi AI nuk është i disponueshëm.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/70">
            Sigurohu që shërbimi Python po ekzekuton në portin 8000.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Parashikimi i mirëmbajtjes" count={risks.length}>
        {critical > 0 && (
          <div className="flex items-center gap-2 text-[var(--status-warning)]">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[13px]">{critical} me rrezik të lartë</span>
          </div>
        )}

        <span className="font-mono text-[12px] text-muted-foreground">
          mesatarja {avgScore.toFixed(1)}
        </span>

        <button
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
            strokeWidth={2}
          />
          {refresh.isPending ? "Duke analizuar..." : "Rivlerëso"}
        </button>

        <CreateMaintenanceDialog />
      </PageHeader>

      {/* Përmbledhja sipas nivelit */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(["Critical", "High", "Medium", "Low"] as const).map((level) => {
          const count = risks.filter((r) => r.riskLevel === level).length;
          const style = LEVEL_STYLES[level];
          return (
            <div key={level} className="rounded-lg border bg-card px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: style.color }}
                />
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {style.label}
                </p>
              </div>
              <p className="mt-1.5 font-mono text-3xl font-medium tabular-nums">
                {count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Shpjegimi */}
      <div className="flex items-start gap-3 rounded-lg border bg-card px-6 py-4">
        <Activity
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Vlerësimi kombinon orët e fluturimit, kohën nga servisi i fundit,
          shëndetin e baterive, dridhjet dhe temperaturën nga telemetria, konsumin
          e baterisë krahasuar me dronët e të njëjtit model, dhe problemet e
          raportuara. Kliko një rresht për të parë kontributin e secilit faktor.
        </p>
      </div>

      <ListCard
        isLoading={isLoading}
        isEmpty={risks.length === 0}
        emptyIcon={Wrench}
        emptyText="Nuk ka vlerësime."
      >
        {risks.map((r) => (
          <DroneRiskRow key={r.droneId} risk={r} />
        ))}
      </ListCard>
    </div>
  );
}