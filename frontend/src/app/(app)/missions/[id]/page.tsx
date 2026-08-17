"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MissionMap } from "@/components/map/mission-map";
import { WaypointEditor, type Row } from "@/components/waypoint-editor";
import {
  Mission,
  Drone,
  Battery,
  Pilot,
  Waypoint,
  ConflictCheck,
  FlightZone,
} from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ShieldCheck, MapPin } from "lucide-react";
import { PreflightPanel } from "@/components/preflight-panel";
import { FlightReportPanel } from "@/components/flight-report-panel";
import { ClipboardCheck, FileText } from "lucide-react";

const actions: Record<string, { label: string; path: string; variant?: "outline" }[]> = {
  Planned: [
    { label: "Aprovo", path: "approve" },
    { label: "Anulo", path: "cancel", variant: "outline" },
  ],
  Approved: [
    { label: "Nis misionin", path: "start" },
    { label: "Anulo", path: "cancel", variant: "outline" },
  ],
  InProgress: [
    { label: "Përfundo", path: "complete" },
    { label: "Ndërprit", path: "abort", variant: "outline" },
  ],
};

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  // ==== TE GJITHA HOOK-ET KETU, PARA CDO RETURN ====
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictCheck | null>(null);
  const [droneSel, setDroneSel] = useState<string | null>(null);
  const [batterySel, setBatterySel] = useState<string | null>(null);
  const [pilotSel, setPilotSel] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [rowsKey, setRowsKey] = useState("");

  const { data: mission } = useQuery({
    queryKey: ["mission", id],
    queryFn: async () => (await api.get<Mission>(`/missions/${id}`)).data,
  });

  const { data: drones } = useQuery({
    queryKey: ["drones"],
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
  });

  const { data: batteries } = useQuery({
    queryKey: ["batteries"],
    queryFn: async () => (await api.get<Battery[]>("/batteries")).data,
  });

  const { data: pilots } = useQuery({
    queryKey: ["pilots"],
    queryFn: async () => (await api.get<Pilot[]>("/pilots")).data,
  });

  const { data: zones } = useQuery({
    queryKey: ["flight-zones"],
    queryFn: async () => (await api.get<FlightZone[]>("/flight-zones")).data,
  });

  const { data: waypoints } = useQuery({
    queryKey: ["waypoints", id],
    queryFn: async () =>
      (await api.get<Waypoint[]>(`/missions/${id}/waypoints`)).data,
  });

  const assign = useMutation({
    mutationFn: async () =>
      api.post(`/missions/${id}/assign`, {
        droneId: droneSel ?? mission?.droneId ?? "",
        batteryId: batterySel ?? mission?.batteryId ?? "",
        pilotId: (pilotSel ?? mission?.pilotId) || null,
      }),
    onSuccess: () => {
      refresh();
      setError(null);
      setConflicts(null);
    },
    onError: (err) => setError(getApiError(err, "Caktimi dështoi.")),
  });

  const check = useMutation({
    mutationFn: async () =>
      (await api.get<ConflictCheck>(`/missions/${id}/conflicts`)).data,
    onSuccess: (data) => {
      setConflicts(data);
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Kontrolli dështoi.")),
  });

  const action = useMutation({
    mutationFn: async (path: string) => api.post(`/missions/${id}/${path}`),
    onSuccess: () => {
      refresh();
      setError(null);
      setConflicts(null);
    },
    onError: (err) => setError(getApiError(err, "Veprimi nuk u krye.")),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["mission", id] });
    queryClient.invalidateQueries({ queryKey: ["missions"] });
    queryClient.invalidateQueries({ queryKey: ["drones"] });
    queryClient.invalidateQueries({ queryKey: ["batteries"] });
  }

  // Sinkronizim i rreshtave kur vijne waypoints te reja
  const incomingKey = waypoints?.map((w) => w.id).join(",") ?? "";
  if (waypoints && incomingKey !== rowsKey) {
    setRowsKey(incomingKey);
    setRows(
      waypoints.map((w) => ({
        lat: String(w.latitude),
        lng: String(w.longitude),
        alt: w.altitudeMeters !== null ? String(w.altitudeMeters) : "",
        action: w.actionType ?? "Waypoint",
      }))
    );
  }

  // ==== RETURN I HERSHEM VETEM PAS HOOK-EVE ====
  if (!mission) {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        Duke ngarkuar...
      </p>
    );
  }

  const droneId = droneSel ?? mission.droneId ?? "";
  const batteryId = batterySel ?? mission.batteryId ?? "";
  const pilotId = pilotSel ?? mission.pilotId ?? "";
  const zone = zones?.find((z) => z.id === mission.flightZoneId);
  const editable = mission.status === "Planned";
  const waypointsEditable =
    mission.status === "Planned" || mission.status === "Approved";

  const mapPoints = rows
    .filter((r) => r.lat && r.lng)
    .map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      alt: r.alt ? Number(r.alt) : null,
    }));

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b bg-card px-6 py-4">
        <Link
          href="/missions"
          className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Misionet
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-heading text-xl font-semibold">{mission.title}</h1>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              {mission.missionType} · {mission.flightZoneName} ·{" "}
              {mission.isAutonomous ? "autonom" : "me pilot"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={mission.status} />
            {actions[mission.status]?.map((a) => (
              <Button
                key={a.path}
                size="sm"
                variant={a.variant}
                disabled={action.isPending}
                onClick={() => action.mutate(a.path)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <div className="border-b border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 px-6 py-2.5">
          <p className="text-[13px] text-[var(--status-warning)]">{error}</p>
        </div>
      )}

      <div className="grid flex-1 gap-px bg-border lg:grid-cols-2">
        {/* Burimet */}
        <section className="bg-card p-6">
          <h2 className="mb-4 font-heading text-sm font-semibold">Burimet</h2>

          {editable ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Droni</Label>
                <Select value={droneId} onValueChange={setDroneSel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidh dronin" />
                  </SelectTrigger>
                  <SelectContent>
                    {drones?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.serialNumber} · {d.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bateria</Label>
                <Select value={batteryId} onValueChange={setBatterySel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidh baterinë" />
                  </SelectTrigger>
                  <SelectContent>
                    {batteries?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.serialNumber} · {b.healthPercentage.toFixed(0)}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Piloti{" "}
                  <span className="text-muted-foreground">
                    {mission.isAutonomous ? "(opsional)" : "(i detyrueshëm)"}
                  </span>
                </Label>
                <Select value={pilotId} onValueChange={setPilotSel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pa pilot" />
                  </SelectTrigger>
                  <SelectContent>
                    {pilots?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName ?? p.licenseNumber ?? "Pilot"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => assign.mutate()}
                  disabled={!droneId || !batteryId || assign.isPending}
                >
                  Cakto burimet
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => check.mutate()}
                  disabled={check.isPending}
                >
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Kontrollo konfliktet
                </Button>
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-[13px]">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Droni</dt>
                <dd className="font-mono">{mission.droneSerialNumber ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Bateria</dt>
                <dd className="font-mono">{mission.batterySerialNumber ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Piloti</dt>
                <dd className="font-mono">{mission.pilotLicense ?? "autonom"}</dd>
              </div>
            </dl>
          )}

          {conflicts && (
            <div
              className={`mt-4 rounded-md border p-3 ${
                conflicts.hasConflicts
                  ? "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10"
                  : "border-[var(--status-clear)]/30 bg-[var(--status-clear)]/10"
              }`}
            >
              {conflicts.hasConflicts ? (
                <ul className="space-y-1">
                  {conflicts.conflicts.map((c, i) => (
                    <li key={i} className="text-[12px] text-[var(--status-warning)]">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-[var(--status-clear)]">
                  Asnjë konflikt. Misioni mund të aprovohet.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Rruga */}
        <section className="flex flex-col bg-card">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <h2 className="font-heading text-sm font-semibold">
                Rruga e fluturimit
              </h2>
            </div>
            {waypointsEditable && (
              <span className="font-mono text-[11px] text-muted-foreground">
                Kliko në hartë për të shtuar pikë
              </span>
            )}
          </div>

          <div className="h-72 shrink-0">
            <MissionMap
              zone={zone}
              points={mapPoints}
              editable={waypointsEditable}
              onAdd={(lat, lng) =>
                setRows((prev) => [
                  ...prev,
                  {
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6),
                    alt: "100",
                    action: "Waypoint",
                  },
                ])
              }
              onMove={(i, lat, lng) =>
                setRows((prev) =>
                  prev.map((r, idx) =>
                    idx === i
                      ? { ...r, lat: lat.toFixed(6), lng: lng.toFixed(6) }
                      : r
                  )
                )
              }
            />
          </div>

          <div className="p-6">
            <WaypointEditor
              missionId={id}
              waypoints={waypoints}
              editable={waypointsEditable}
              rows={rows}
              setRows={setRows}
            />
          </div>
        </section>
      </div>
      {/* Checklist / Raport */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <h2 className="font-heading text-sm font-semibold">
              Kontrolli para fluturimit
            </h2>
          </div>
          <PreflightPanel
            missionId={id}
            editable={
              mission.status === "Planned" || mission.status === "Approved"
            }
          />
        </section>

        {["Completed", "Aborted"].includes(mission.status) && (
          <section className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <h2 className="font-heading text-sm font-semibold">
                Raporti pas fluturimit
              </h2>
            </div>
            <FlightReportPanel missionId={id} />
          </section>
        )}
      </div>
    </div>
  );
}