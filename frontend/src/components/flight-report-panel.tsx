"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FlightReport } from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export function FlightReportPanel({ missionId }: { missionId: string }) {
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState("");
  const [battery, setBattery] = useState("");
  const [issues, setIssues] = useState("");
  const [weather, setWeather] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", missionId],
    queryFn: async () => {
      try {
        return (await api.get<FlightReport>(`/missions/${missionId}/report`)).data;
      } catch {
        return null;
      }
    },
  });

  const submit = useMutation({
    mutationFn: async () =>
      api.post(`/missions/${missionId}/report`, {
        flightDurationMinutes: Number(duration),
        batteryUsedPercentage: battery ? Number(battery) : null,
        issuesReported: issues || null,
        weatherConditions: weather || null,
        summary: summary || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", missionId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Raporti nuk u ruajt.")),
  });

  if (isLoading) {
    return <p className="text-[13px] text-muted-foreground">Duke ngarkuar...</p>;
  }

  // I dorëzuar
  if (report) {
    return (
      <div className="space-y-4">
        <dl className="space-y-2.5 text-[13px]">
          <div className="flex justify-between border-b pb-2">
            <dt className="text-muted-foreground">Kohëzgjatja</dt>
            <dd className="font-mono tabular-nums">
              {report.flightDurationMinutes} min
            </dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-muted-foreground">Bateria e përdorur</dt>
            <dd className="font-mono tabular-nums">
              {report.batteryUsedPercentage != null
                ? `${report.batteryUsedPercentage}%`
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between border-b pb-2">
            <dt className="text-muted-foreground">Moti</dt>
            <dd>{report.weatherConditions ?? "—"}</dd>
          </div>
        </dl>

        {report.summary && (
          <p className="text-[13px] leading-relaxed">{report.summary}</p>
        )}

        {report.issuesReported && (
          <div className="rounded-md border border-[var(--status-caution)]/30 bg-[var(--status-caution)]/10 px-3 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--status-caution)]">
              Probleme të raportuara
            </p>
            <p className="mt-1 text-[13px]">{report.issuesReported}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              U hap automatikisht një punë mirëmbajtjeje.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <p className="font-mono text-[11px] text-muted-foreground">
            {report.submittedByName ?? "Pilot"} ·{" "}
            {report.submittedAt.slice(0, 16).replace("T", " ")}Z
          </p>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            AI: {report.aiAnalysisStatus}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="dur">Kohëzgjatja (min)</Label>
          <Input
            id="dur"
            type="number"
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bat">Bateria e përdorur (%)</Label>
          <Input
            id="bat"
            type="number"
            min="0"
            max="100"
            value={battery}
            onChange={(e) => setBattery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weather">Kushtet e motit</Label>
        <Input
          id="weather"
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          placeholder="I kthjellët, erë 8 km/h"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issues">Probleme të vërejtura</Label>
        <Input
          id="issues"
          value={issues}
          onChange={(e) => setIssues(e.target.value)}
          placeholder="Lëre bosh nëse s'pati probleme"
        />
        {issues && (
          <p className="text-[11px] text-[var(--status-caution)]">
            Do të hapet automatikisht një punë mirëmbajtjeje.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Përmbledhje</Label>
        <Input
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Si shkoi misioni"
        />
      </div>

      {error && (
        <p className="text-[12px] text-[var(--status-warning)]">{error}</p>
      )}

      <Button
        size="sm"
        onClick={() => submit.mutate()}
        disabled={!duration || submit.isPending}
      >
        {submit.isPending ? "Duke ruajtur..." : "Dorëzo raportin"}
      </Button>
    </div>
  );
}