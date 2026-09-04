"use client";

import { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FlightZone, Waypoint } from "@/lib/types";
import { useTelemetry, LiveDrone } from "@/lib/use-telemetry";
import { computeProgress, FlightProgress } from "@/lib/flight-progress";
import { LiveMap, type TrackLine, type PlannedRoute } from "@/components/map/live-map";
import { DroneStrip } from "@/components/live/drone-strip";
import { TelemetryPanel } from "@/components/live/telemetry-panel";
import { CameraPanel } from "@/components/live/camera-panel";
import { DroneGrid } from "@/components/live/drone-grid";
import { ZuluClock } from "@/components/zulu-clock";
import { PageHeader } from "@/components/page-header";
import {
  Radio,
  AlertTriangle,
  Crosshair,
  Plane,
  Layers,
  Focus,
  LayoutGrid,
  Gauge,
  Video,
} from "lucide-react";

interface TrackPoint {
  latitude: number;
  longitude: number;
}

type ViewMode = "fleet" | "focus" | "grid";
type PanelTab = "telemetry" | "camera";

const VIEWS: { key: ViewMode; label: string; icon: typeof Layers }[] = [
  { key: "fleet", label: "Flota", icon: Layers },
  { key: "focus", label: "Fokus", icon: Focus },
  { key: "grid", label: "Rrjet", icon: LayoutGrid },
];

const TABS: { key: PanelTab; label: string; icon: typeof Gauge }[] = [
  { key: "telemetry", label: "Telemetria", icon: Gauge },
  { key: "camera", label: "Kamera", icon: Video },
];

export default function LivePage() {
  const [view, setView] = useState<ViewMode>("fleet");
  const [panelTab, setPanelTab] = useState<PanelTab>("telemetry");
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

  // Ne modin fokus, harta tregon vetem dronin e zgjedhur
  const isFocus = view === "focus" && selected !== null;

  const mapDrones = isFocus ? [selected!] : drones;
  const mapTracks = isFocus
    ? tracks.filter((t) => t.droneId === selected!.droneId)
    : tracks;
  const mapRoutes = isFocus
    ? routes.filter((r) => r.droneId === selected!.droneId)
    : routes;

  function focusDrone(id: string) {
    setSelectedId(id);
    setView("focus");
  }

  return (
    <div className="flex flex-col gap-5">
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

      {drones.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-16 text-center">
          <Plane className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">
            Asnjë dron nuk po transmeton.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/70">
            Nis një mision për të parë telemetrinë.
          </p>
        </div>
      ) : (
        <>
          {/* Shiriti i droneve — gjithmone i dukshem */}
          <DroneStrip
            drones={drones}
            selectedId={selectedId}
            onSelect={setSelectedId}
            progressMap={progressMap}
          />

          {/* Ndërruesi i pamjeve */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg border bg-card p-1">
              {VIEWS.map((v) => {
                const Icon = v.icon;
                const disabled = v.key === "focus" && !selected;
                return (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    disabled={disabled}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      view === v.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {v.label}
                  </button>
                );
              })}
            </div>

            {view !== "grid" && selected && (
              <button
                onClick={() => setFollowing((f) => !f)}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  following
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
                {following ? "Duke ndjekur" : "Ndiq dronin"}
              </button>
            )}
          </div>

          {/* Pamja */}
          {view === "grid" ? (
            <DroneGrid
              drones={drones}
              zones={zones ?? []}
              tracks={tracks}
              routes={routes}
              progressMap={progressMap}
              onFocus={focusDrone}
            />
          ) : (
            <div
              className={`grid gap-5 ${
                view === "focus"
                  ? "xl:grid-cols-[1fr_380px]"
                  : "xl:grid-cols-[1fr_300px]"
              }`}
            >
              {/* Harta */}
              <div className="relative h-[calc(100vh-330px)] min-h-[420px] overflow-hidden rounded-lg border bg-card">
                <LiveMap
                  drones={mapDrones}
                  zones={zones ?? []}
                  tracks={mapTracks}
                  routes={mapRoutes}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  followTarget={followTarget}
                />
              </div>

              {/* Paneli */}
              <div className="flex h-[calc(100vh-330px)] min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card">
                {selected ? (
                  <>
                    <div className="flex shrink-0 border-b">
                      {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = panelTab === t.key;
                        return (
                          <button
                            key={t.key}
                            onClick={() => setPanelTab(t.key)}
                            className={`relative flex flex-1 cursor-pointer items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-colors ${
                              active
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            {t.label}
                            {active && (
                              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {panelTab === "telemetry" ? (
                        <TelemetryPanel
                          drone={selected}
                          progress={progressMap.get(selected.droneId)}
                        />
                      ) : (
                        <CameraPanel drone={selected} />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <p className="text-[13px] text-muted-foreground">
                      Zgjidh një dron nga shiriti lart për të parë telemetrinë.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}