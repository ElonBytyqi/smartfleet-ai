"use client";

import { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FlightZone, Waypoint } from "@/lib/types";
import { useTelemetry, LiveDrone } from "@/lib/use-telemetry";
import { droneColor } from "@/lib/drone-colors";
import { computeProgress, FlightProgress } from "@/lib/flight-progress";
import { formatDistance, formatEta } from "@/lib/geo";
import { LiveMap, type TrackLine, type PlannedRoute } from "@/components/map/live-map";
import { ZuluClock } from "@/components/zulu-clock";
import { PageHeader } from "@/components/page-header";
import {
  Radio,
  AlertTriangle,
  Crosshair,
  Plane,
  Navigation,
  Target,
} from "lucide-react";

interface TrackPoint {
  latitude: number;
  longitude: number;
}

function batteryColor(p: number) {
  if (p <= 15) return "var(--status-warning)";
  if (p <= 25) return "var(--status-caution)";
  return "var(--status-clear)";
}

function DronePanel({
  drone,
  progress,
}: {
  drone: LiveDrone;
  progress?: FlightProgress;
}) {
  const fields = [
    { label: "Lartësia", value: `${drone.altitudeMeters.toFixed(0)} m` },
    { label: "Shpejtësia", value: `${drone.groundSpeedMs.toFixed(1)} m/s` },
    { label: "Drejtimi", value: `${drone.headingDegrees.toFixed(0)}°` },
    { label: "Satelitë", value: drone.satelliteCount },
    { label: "Modi", value: drone.flightMode },
    { label: "Gjendja", value: drone.isArmed ? "I armatosur" : "Në tokë" },
  ];

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: droneColor(drone.droneId) }}
        />
        <div className="min-w-0">
          <p className="truncate font-mono text-[14px] font-medium">
            {drone.serialNumber}
          </p>
          <p className="truncate text-[12px] text-muted-foreground">
            {drone.nickname ?? "—"}
            {drone.missionTitle && ` · ${drone.missionTitle}`}
          </p>
        </div>
      </div>

      {/* Bateria */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Bateria
          </span>
          <span className="font-mono text-[13px] tabular-nums">
            {drone.batteryPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${drone.batteryPercentage}%`,
              background: batteryColor(drone.batteryPercentage),
            }}
          />
        </div>
      </div>

      {/* Navigimi */}
      {progress && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Navigimi
            </span>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">
                Pika {progress.currentLeg} nga {progress.totalLegs}
              </span>
              <span className="font-mono text-[13px] tabular-nums">
                {progress.percentComplete.toFixed(0)}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress.percentComplete}%`,
                  background: droneColor(drone.droneId),
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <Target className="h-2.5 w-2.5" strokeWidth={2.5} />
                Deri te pika
              </p>
              <p className="mt-0.5 font-mono text-[13px] tabular-nums">
                {formatDistance(progress.distanceToNext)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                E mbetur
              </p>
              <p className="mt-0.5 font-mono text-[13px] tabular-nums">
                {formatDistance(progress.distanceRemaining)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Koha
              </p>
              <p className="mt-0.5 font-mono text-[13px] tabular-nums">
                {formatEta(progress.etaSeconds)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Drejtimi
              </p>
              <p className="mt-0.5 font-mono text-[13px] tabular-nums">
                {progress.bearingToNext.toFixed(0)}°
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {f.label}
            </p>
            <p className="mt-0.5 font-mono text-[13px] tabular-nums">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Pozicioni
        </p>
        <p className="mt-1 font-mono text-[12px] tabular-nums">
          {drone.latitude.toFixed(6)}
          <br />
          {drone.longitude.toFixed(6)}
        </p>
      </div>

      {drone.warnings.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 p-3">
          {drone.warnings.map((w, i) => (
            <p
              key={i}
              className="flex items-start gap-2 text-[12px] text-[var(--status-warning)]"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);

  const { data: initial } = useQuery({
    queryKey: ["live-fleet"],
    queryFn: async () => (await api.get<LiveDrone[]>("/telemetry/live")).data,
    refetchInterval: 30_000,
  });

  const { data: zones } = useQuery({
    queryKey: ["flight-zones"],
    queryFn: async () => (await api.get<FlightZone[]>("/flight-zones")).data,
  });

  const { drones, connected } = useTelemetry(initial ?? []);

  const missionIds = drones
    .map((d) => d.missionId)
    .filter((id): id is string => !!id);

  // Trajektoret e fluturuara
  const trackQueries = useQueries({
    queries: missionIds.map((missionId) => ({
      queryKey: ["mission-track", missionId],
      queryFn: async () =>
        (await api.get<TrackPoint[]>(`/telemetry/missions/${missionId}/track`)).data,
      refetchInterval: 5_000,
    })),
  });

  // Rrugët e planifikuara
  const waypointQueries = useQueries({
    queries: missionIds.map((missionId) => ({
      queryKey: ["waypoints", missionId],
      queryFn: async () =>
        (await api.get<Waypoint[]>(`/missions/${missionId}/waypoints`)).data,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const tracks: TrackLine[] = trackQueries
    .map((q, i) => {
      const data = q.data;
      if (!data || data.length < 2) return null;

      const droneId = drones.find((d) => d.missionId === missionIds[i])?.droneId;
      if (!droneId) return null;

      return {
        droneId,
        points: data.map((p) => [p.latitude, p.longitude] as [number, number]),
      };
    })
    .filter((t): t is TrackLine => t !== null);

  // Progresi dhe rrugët
  const progressMap = new Map<string, FlightProgress>();
  const routes: PlannedRoute[] = [];

  missionIds.forEach((missionId, i) => {
    const drone = drones.find((d) => d.missionId === missionId);
    const wps = waypointQueries[i]?.data;
    if (!drone || !wps || wps.length < 2) return;

    const points = wps
      .slice()
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map((w) => ({
        lat: Number(w.latitude),
        lng: Number(w.longitude),
        seq: w.sequenceNumber,
      }));

    const progress = computeProgress(
      { lat: drone.latitude, lng: drone.longitude },
      points.map((p) => ({ lat: p.lat, lng: p.lng })),
      drone.groundSpeedMs
    );

    if (progress) {
      progressMap.set(drone.droneId, progress);
      routes.push({
        droneId: drone.droneId,
        waypoints: points,
        nextIndex: progress.nextWaypointIndex,
      });
    }
  });

  const selected = drones.find((d) => d.droneId === selectedId) ?? null;
  const withWarnings = drones.filter((d) => d.warnings.length > 0).length;

  const followTarget: [number, number] | null =
    following && selected ? [selected.latitude, selected.longitude] : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ndjekja live" count={drones.length}>
        {withWarnings > 0 && (
          <div className="flex items-center gap-2 text-[var(--status-caution)]">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[13px]">{withWarnings} me alarme</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Radio
            className={`h-3.5 w-3.5 ${
              connected
                ? "animate-pulse text-[var(--status-clear)]"
                : "text-muted-foreground/50"
            }`}
            strokeWidth={2}
          />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {connected ? "Live" : "I shkëputur"}
          </span>
        </div>

        <ZuluClock />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Lista */}
        <aside className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border bg-card">
          {drones.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Plane className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="text-[13px] text-muted-foreground">
                Asnjë dron nuk po transmeton.
              </p>
              <p className="font-mono text-[11px] text-muted-foreground/70">
                Nis një mision për të parë telemetrinë.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {drones.map((d) => {
                const p = progressMap.get(d.droneId);
                return (
                  <button
                    key={d.droneId}
                    onClick={() => setSelectedId(d.droneId)}
                    className={`w-full cursor-pointer px-5 py-3.5 text-left transition-colors ${
                      selectedId === d.droneId ? "bg-primary/8" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: droneColor(d.droneId) }}
                        />
                        <p className="truncate font-mono text-[13px] font-medium">
                          {d.serialNumber}
                        </p>
                      </div>
                      <span
                        className="shrink-0 font-mono text-[12px] tabular-nums"
                        style={{ color: batteryColor(d.batteryPercentage) }}
                      >
                        {d.batteryPercentage.toFixed(0)}%
                      </span>
                    </div>

                    <p className="mt-0.5 pl-4 font-mono text-[11px] text-muted-foreground">
                      {d.altitudeMeters.toFixed(0)}m · {d.groundSpeedMs.toFixed(1)}m/s
                      {d.secondsSinceUpdate > 10 &&
                        ` · ${d.secondsSinceUpdate}s më parë`}
                    </p>

                    {p && (
                      <>
                        <div className="mt-1.5 ml-4 h-0.5 w-[calc(100%-1rem)] overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${p.percentComplete}%`,
                              background: droneColor(d.droneId),
                            }}
                          />
                        </div>
                        <p className="mt-1 pl-4 font-mono text-[11px] text-muted-foreground">
                          {p.percentComplete.toFixed(0)}% ·{" "}
                          {formatDistance(p.distanceRemaining)} ·{" "}
                          {formatEta(p.etaSeconds)}
                        </p>
                      </>
                    )}

                    {d.warnings.length > 0 && (
                      <p className="mt-1 pl-4 text-[11px] text-[var(--status-warning)]">
                        {d.warnings[0]}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Harta dhe paneli */}
        <div className="grid gap-6 xl:grid-cols-[1fr_270px]">
          <div className="relative h-[calc(100vh-220px)] overflow-hidden rounded-lg border bg-card">
            <LiveMap
              drones={drones}
              zones={zones ?? []}
              tracks={tracks}
              routes={routes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              followTarget={followTarget}
            />

            {selected && (
              <button
                onClick={() => setFollowing((f) => !f)}
                className={`absolute right-4 top-4 z-[1000] flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12px] font-medium shadow-sm transition-colors ${
                  following
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
                {following ? "Duke ndjekur" : "Ndiq dronin"}
              </button>
            )}
          </div>

          {selected && (
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border bg-card">
              <DronePanel
                drone={selected}
                progress={progressMap.get(selected.droneId)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}