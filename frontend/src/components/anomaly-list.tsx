"use client";

import { Anomaly } from "@/lib/types";
import { AlertTriangle, AlertCircle, Info, ShieldCheck } from "lucide-react";

const SEVERITY: Record<string, { color: string; label: string; icon: typeof AlertTriangle }> = {
  Critical: {
    color: "var(--status-warning)",
    label: "Kritike",
    icon: AlertTriangle,
  },
  High: { color: "var(--status-warning)", label: "E lartë", icon: AlertCircle },
  Medium: { color: "var(--status-caution)", label: "Mesatare", icon: AlertCircle },
  Low: { color: "var(--muted-foreground)", label: "E ulët", icon: Info },
};

export function AnomalyList({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-[var(--status-clear)]/30 bg-[var(--status-clear)]/10 px-4 py-3">
        <ShieldCheck
          className="h-4 w-4 shrink-0 text-[var(--status-clear)]"
          strokeWidth={2}
        />
        <p className="text-[13px] text-[var(--status-clear)]">
          Asnjë anomali e zbuluar në këtë fluturim.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {anomalies.map((a, i) => {
        const s = SEVERITY[a.severity] ?? SEVERITY.Low;
        const Icon = s.icon;

        return (
          <div
            key={i}
            className="rounded-md border p-3.5"
            style={{
              borderColor: `color-mix(in oklab, ${s.color} 30%, transparent)`,
              background: `color-mix(in oklab, ${s.color} 8%, transparent)`,
            }}
          >
            <div className="flex items-start gap-3">
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: s.color }}
                strokeWidth={2}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-medium">{a.title}</p>
                  <span
                    className="rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                    style={{
                      color: s.color,
                      borderColor: `color-mix(in oklab, ${s.color} 35%, transparent)`,
                    }}
                  >
                    {s.label}
                  </span>
                  {a.occurrences && a.occurrences > 1 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {a.occurrences}× herë
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[12px] text-muted-foreground">{a.detail}</p>

                <p className="mt-1.5 text-[12px]">{a.recommendation}</p>

                {a.flightTime && (
                  <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                    Fluturimi {a.flightIndex} · {a.flightTime}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}