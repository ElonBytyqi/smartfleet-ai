"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone, Battery, Mission } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, BatteryMedium, Route, Plane } from "lucide-react";

export default function DroneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: drone } = useQuery({
    queryKey: ["drone", id],
    queryFn: async () => (await api.get<Drone>(`/drones/${id}`)).data,
  });

  const { data: batteries } = useQuery({
    queryKey: ["batteries", "drone", id],
    queryFn: async () =>
      (await api.get<Battery[]>(`/batteries?droneId=${id}`)).data,
  });

  const { data: missions } = useQuery({
    queryKey: ["missions", "drone", id],
    queryFn: async () =>
      (await api.get<Mission[]>(`/missions?droneId=${id}`)).data,
  });

  if (!drone) {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        Duke ngarkuar...
      </p>
    );
  }

  const completed = missions?.filter((m) => m.status === "Completed").length ?? 0;
  const aborted = missions?.filter((m) => m.status === "Aborted").length ?? 0;
  const upcoming = missions?.filter((m) =>
    ["Planned", "Approved", "InProgress"].includes(m.status)
  ).length ?? 0;

  const stats = [
    { label: "Orë fluturimi", value: drone.totalFlightHours.toFixed(1) },
    { label: "Misione të kryera", value: completed },
    { label: "Të ndërprera", value: aborted },
    { label: "Të planifikuara", value: upcoming },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="rounded-lg border bg-card px-6 py-4">
        <Link
          href="/drones"
          className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Dronët
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl font-semibold">
                {drone.nickname ?? drone.serialNumber}
              </h1>
              <StatusBadge status={drone.status} />
            </div>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              {drone.serialNumber} · {drone.modelName ?? "model i panjohur"}
              {drone.purchaseDate && ` · blerë ${drone.purchaseDate}`}
            </p>
          </div>
        </div>
      </header>

      {/* Statistikat */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Bateritë */}
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <BatteryMedium
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            <h2 className="font-heading text-sm font-semibold">
              Bateritë e lidhura
            </h2>
          </div>

          {!batteries || batteries.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Asnjë bateri e caktuar te ky dron.
            </p>
          ) : (
            <div className="divide-y">
              {batteries.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <div>
                    <p className="font-mono text-[13px] font-medium">
                      {b.serialNumber}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {b.capacityMah} mAh · {b.cycleCount} cikle
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-[13px] tabular-nums">
                        {b.healthPercentage.toFixed(0)}%
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Historiku i misioneve */}
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <h2 className="font-heading text-sm font-semibold">
              Historiku i misioneve
            </h2>
          </div>

          {!missions || missions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Plane
                className="h-7 w-7 text-muted-foreground/40"
                strokeWidth={1.5}
              />
              <p className="text-[13px] text-muted-foreground">
                Ky dron s&apos;ka fluturuar ende.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {missions.slice(0, 10).map((m) => (
                <Link
                  key={m.id}
                  href={`/missions/${m.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors first:pt-0 hover:text-primary"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{m.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {m.flightZoneName} · {m.scheduledStart.slice(0, 10)}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}