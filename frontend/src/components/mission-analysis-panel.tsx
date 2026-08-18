"use client";

import { useMissionAnalysis } from "@/lib/queries";
import { AnomalyList } from "@/components/anomaly-list";
import { Brain } from "lucide-react";

function healthColor(score: number) {
  if (score >= 80) return "var(--status-clear)";
  if (score >= 55) return "var(--status-caution)";
  return "var(--status-warning)";
}

export function MissionAnalysisPanel({ missionId }: { missionId: string }) {
  const { data, isLoading, isError } = useMissionAnalysis(missionId);

  if (isLoading) {
    return (
      <p className="text-[13px] text-muted-foreground">Duke analizuar...</p>
    );
  }

  if (isError) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Shërbimi AI nuk është i disponueshëm.
      </p>
    );
  }

  if (!data || data.telemetryPoints < 10) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Brain className="h-7 w-7 text-muted-foreground/40" strokeWidth={1.5} />
        <p className="text-[13px] text-muted-foreground">
          Nuk ka telemetri të mjaftueshme për analizë.
        </p>
      </div>
    );
  }

  const stats = [
    { label: "Fluturime", value: data.flightCount },
    {
      label: "Kohëzgjatja",
      value: data.durationMinutes ? `${data.durationMinutes.toFixed(0)} min` : "—",
    },
    {
      label: "Bateria",
      value: data.batteryUsed ? `${data.batteryUsed.toFixed(0)}%` : "—",
    },
    {
      label: "Devijimi",
      value:
        data.maxDeviationMeters !== null
          ? `${data.maxDeviationMeters.toFixed(0)} m`
          : "—",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Health score */}
      {data.healthScore !== null && (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Shëndeti i fluturimit
            </span>
            <span
              className="font-mono text-[18px] font-medium tabular-nums"
              style={{ color: healthColor(data.healthScore) }}
            >
              {data.healthScore}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${data.healthScore}%`,
                background: healthColor(data.healthScore),
              }}
            />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">{data.summary}</p>
        </div>
      )}

      {/* Statistikat */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-0.5 font-mono text-[13px] tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Anomalitë */}
      <div>
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Anomalitë
        </p>
        <AnomalyList anomalies={data.anomalies} />
      </div>

      <p className="font-mono text-[10px] text-muted-foreground">
        {data.telemetryPoints.toLocaleString()} pika telemetrie · analizuar{" "}
        {data.analyzedAt.slice(0, 16).replace("T", " ")}
      </p>
    </div>
  );
}