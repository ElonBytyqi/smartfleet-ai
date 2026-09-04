"use client";

import { LiveDrone } from "@/lib/use-telemetry";
import { droneColor } from "@/lib/drone-colors";
import { FlightProgress } from "@/lib/flight-progress";
import { AlertTriangle } from "lucide-react";

function batteryColor(p: number) {
  if (p <= 15) return "var(--status-warning)";
  if (p <= 25) return "var(--status-caution)";
  return "var(--status-clear)";
}

export function DroneStrip({
  drones,
  selectedId,
  onSelect,
  progressMap,
}: {
  drones: LiveDrone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  progressMap: Map<string, FlightProgress>;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {drones.map((d) => {
        const color = droneColor(d.droneId);
        const selected = selectedId === d.droneId;
        const progress = progressMap.get(d.droneId);
        const alert = d.warnings.length > 0;

        return (
          <button
            key={d.droneId}
            onClick={() => onSelect(d.droneId)}
            className={`relative w-[200px] shrink-0 cursor-pointer rounded-lg border bg-card px-4 py-3 text-left transition-all ${
              selected
                ? "border-primary/50 ring-1 ring-primary/30"
                : "hover:border-border/80 hover:bg-muted/30"
            }`}
          >
            {/* Vija e ngjyres se dronit */}
            <span
              className="absolute left-0 top-3 h-[calc(100%-24px)] w-[3px] rounded-full"
              style={{ background: color }}
            />

            <div className="flex items-start justify-between gap-2 pl-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-[13px] font-medium">
                  {d.serialNumber}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {d.nickname ?? "—"}
                </p>
              </div>

              {alert && (
                <AlertTriangle
                  className="h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]"
                  strokeWidth={2}
                />
              )}
            </div>

            {/* Metrikat kryesore */}
            <div className="mt-2.5 grid grid-cols-3 gap-1 pl-2">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  ALT
                </p>
                <p className="font-mono text-[12px] tabular-nums">
                  {d.altitudeMeters.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  SPD
                </p>
                <p className="font-mono text-[12px] tabular-nums">
                  {d.groundSpeedMs.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  BAT
                </p>
                <p
                  className="font-mono text-[12px] tabular-nums"
                  style={{ color: batteryColor(d.batteryPercentage) }}
                >
                  {d.batteryPercentage.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Progresi */}
            {progress && (
              <div className="mt-2.5 pl-2">
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress.percentComplete}%`,
                      background: color,
                    }}
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {progress.currentLeg}/{progress.totalLegs} ·{" "}
                  {progress.percentComplete.toFixed(0)}%
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}