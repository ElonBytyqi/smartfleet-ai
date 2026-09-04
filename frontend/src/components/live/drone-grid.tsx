"use client";

import { LiveDrone } from "@/lib/use-telemetry";
import { FlightZone } from "@/lib/types";
import { droneColor } from "@/lib/drone-colors";
import { FlightProgress } from "@/lib/flight-progress";
import { LiveMap, type TrackLine, type PlannedRoute } from "@/components/map/live-map";
import { AlertTriangle, Maximize2 } from "lucide-react";

function batteryColor(p: number) {
  if (p <= 15) return "var(--status-warning)";
  if (p <= 25) return "var(--status-caution)";
  return "var(--status-clear)";
}

export function DroneGrid({
  drones,
  zones,
  tracks,
  routes,
  progressMap,
  onFocus,
}: {
  drones: LiveDrone[];
  zones: FlightZone[];
  tracks: TrackLine[];
  routes: PlannedRoute[];
  progressMap: Map<string, FlightProgress>;
  onFocus: (id: string) => void;
}) {
  // Kolonat sipas numrit te droneve
  const cols =
    drones.length <= 1 ? 1 : drones.length <= 4 ? 2 : 3;

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {drones.map((d) => {
        const color = droneColor(d.droneId);
        const progress = progressMap.get(d.droneId);
        const myTrack = tracks.filter((t) => t.droneId === d.droneId);
        const myRoute = routes.filter((r) => r.droneId === d.droneId);

        return (
          <div
            key={d.droneId}
            className="overflow-hidden rounded-lg border bg-card"
          >
            {/* Koka */}
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: color }}
              />
              <p className="min-w-0 flex-1 truncate font-mono text-[12px] font-medium">
                {d.serialNumber}
              </p>

              {d.warnings.length > 0 && (
                <AlertTriangle
                  className="h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]"
                  strokeWidth={2}
                />
              )}

              <button
                onClick={() => onFocus(d.droneId)}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
                aria-label="Zmadho"
              >
                <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Harta */}
            <div className="h-[220px]">
              <LiveMap
                drones={[d]}
                zones={zones}
                tracks={myTrack}
                routes={myRoute}
                selectedId={d.droneId}
                onSelect={() => onFocus(d.droneId)}
                followTarget={[d.latitude, d.longitude]}
                compact
              />
            </div>

            {/* Metrikat */}
            <div className="grid grid-cols-4 divide-x border-t">
              {[
                { label: "ALT", value: `${d.altitudeMeters.toFixed(0)}m` },
                { label: "SPD", value: `${d.groundSpeedMs.toFixed(1)}` },
                {
                  label: "BAT",
                  value: `${d.batteryPercentage.toFixed(0)}%`,
                  color: batteryColor(d.batteryPercentage),
                },
                {
                  label: "PRG",
                  value: progress ? `${progress.percentComplete.toFixed(0)}%` : "—",
                },
              ].map((m) => (
                <div key={m.label} className="px-3 py-2">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {m.label}
                  </p>
                  <p
                    className="mt-0.5 font-mono text-[12px] tabular-nums"
                    style={m.color ? { color: m.color } : undefined}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}