"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone, Mission } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { ZuluClock } from "@/components/zulu-clock";
import { AttentionPanel } from "@/components/attention-panel";
import { MissionChart } from "@/components/mission-chart";
import { BatteryHealth } from "@/components/battery-health";
import { Route, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { data: drones } = useQuery({
    queryKey: ["drones"],
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
  });

  const { data: missions } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => (await api.get<Mission[]>("/missions")).data,
  });

  const available = drones?.filter((d) => d.status === "Available").length ?? 0;
  const airborne = drones?.filter((d) => d.status === "InMission").length ?? 0;
  const grounded =
    drones?.filter((d) => d.status === "Grounded" || d.status === "Maintenance")
      .length ?? 0;
  const planned = missions?.filter((m) => m.status === "Planned").length ?? 0;
  const approved = missions?.filter((m) => m.status === "Approved").length ?? 0;
  const active = missions?.filter((m) => m.status === "InProgress").length ?? 0;

  const upcoming = missions
    ?.filter((m) => ["Planned", "Approved", "InProgress"].includes(m.status))
    .slice(0, 6);

  const metrics = [
    { label: "Të lirë", value: available },
    { label: "Në mision", value: airborne },
    { label: "Jashtë shërbimi", value: grounded },
    { label: "Të planifikuara", value: planned },
    { label: "Të aprovuara", value: approved },
    { label: "Aktive", value: active },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Shiriti i operacioneve */}
      <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold">Operacionet</h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Live
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                active > 0 ? "bg-[var(--status-clear)]" : "bg-muted-foreground/40"
              }`}
            />
            <span className="text-[13px] text-muted-foreground">
              {active} në ajër
            </span>
          </div>

          {grounded > 0 && (
            <div className="flex items-center gap-2 text-[var(--status-caution)]">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="text-[13px]">{grounded} jashtë shërbimi</span>
            </div>
          )}

          <ZuluClock />
        </div>
      </header>

      {/* Metrikat */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border bg-card px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1.5 font-mono text-3xl font-medium tabular-nums">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Rreshti i pare: alarmet + grafiku */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-lg border bg-card">
          <AttentionPanel />
        </div>
        <div className="rounded-lg border bg-card">
          <MissionChart missions={missions} />
        </div>
      </div>

      {/* Rreshti i dyte: misionet + baterite */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <h2 className="font-heading text-sm font-semibold">
              Misionet aktive dhe të ardhshme
            </h2>
          </div>

          {upcoming?.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              Nuk ka misione të planifikuara. Krijo një mision për të filluar.
            </p>
          ) : (
            <div className="divide-y">
              {upcoming?.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{m.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {m.droneSerialNumber ?? "pa dron"} · {m.flightZoneName}
                      {!m.isAutonomous && " · me pilot"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {m.scheduledStart.slice(5, 16).replace("T", " ")}Z
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-lg border bg-card">
          <BatteryHealth />
        </div>
      </div>
    </div>
  );
}