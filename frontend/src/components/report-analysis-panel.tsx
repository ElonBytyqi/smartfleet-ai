"use client";

import { useReportAnalysis } from "@/lib/queries";
import { Sparkles, Wrench, ShieldCheck, AlertTriangle } from "lucide-react";

const SEVERITY: Record<string, { color: string; label: string }> = {
  Critical: { color: "var(--status-warning)", label: "Kritike" },
  High: { color: "var(--status-warning)", label: "E lartë" },
  Medium: { color: "var(--status-caution)", label: "Mesatare" },
  Low: { color: "var(--muted-foreground)", label: "E ulët" },
  None: { color: "var(--status-clear)", label: "Pa probleme" },
};

export function ReportAnalysisPanel({ reportId }: { reportId: string }) {
  const { data, isLoading, isError } = useReportAnalysis(reportId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={2} />
        Duke analizuar raportin...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-[12px] text-muted-foreground">
        Analiza AI nuk është e disponueshme.
      </p>
    );
  }

  const overall = SEVERITY[data.overallSeverity] ?? SEVERITY.None;
  const hasFindings = data.issues.length > 0 || data.observations.length > 0;

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Analiza AI
          </span>
        </div>

        <span
          className="rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
          style={{
            color: overall.color,
            borderColor: `color-mix(in oklab, ${overall.color} 35%, transparent)`,
            background: `color-mix(in oklab, ${overall.color} 12%, transparent)`,
          }}
        >
          {overall.label}
        </span>
      </div>

      <p className="text-[13px]">{data.summary}</p>

      {/* Kategoritë e problemeve */}
      {data.issues.length > 0 && (
        <div className="space-y-2">
          {data.issues.map((issue, i) => {
            const s = SEVERITY[issue.severity] ?? SEVERITY.Low;
            return (
              <div key={i} className="border-l-2 pl-3" style={{ borderColor: s.color }}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{issue.label}</span>
                  <span
                    className="font-mono text-[9px] uppercase tracking-wider"
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {issue.recommendation}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                  Terme: {issue.matchedTerms.join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Vërejtjet nga krahasimi me flotën */}
      {data.observations.length > 0 && (
        <div className="space-y-2">
          {data.observations.map((obs, i) => {
            const s = SEVERITY[obs.severity] ?? SEVERITY.Low;
            return (
              <div key={i} className="border-l-2 pl-3" style={{ borderColor: s.color }}>
                <p className="text-[12px]">{obs.text}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {obs.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!hasFindings && (
        <div className="flex items-center gap-2 text-[12px] text-[var(--status-clear)]">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
          Nuk u identifikuan probleme në raport.
        </div>
      )}

      {data.needsMaintenance && (
        <div className="flex items-start gap-2 rounded border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 px-3 py-2">
          <Wrench
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]"
            strokeWidth={2}
          />
          <p className="text-[12px] text-[var(--status-warning)]">
            Rekomandohet mirëmbajtje para fluturimit tjetër.
          </p>
        </div>
      )}
    </div>
  );
}