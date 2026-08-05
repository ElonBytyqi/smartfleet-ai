"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone, Mission } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const inMission = drones?.filter((d) => d.status === "InMission").length ?? 0;
  const planned = missions?.filter((m) => m.status === "Planned").length ?? 0;
  const active = missions?.filter((m) => m.status === "InProgress").length ?? 0;

  const stats = [
    { label: "Dronë të lirë", value: available },
    { label: "Në mision", value: inMission },
    { label: "Misione të planifikuara", value: planned },
    { label: "Misione aktive", value: active },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pamje e përgjithshme e flotës
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-medium">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Misionet e fundit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {missions?.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {m.flightZoneName} · {m.droneSerialNumber ?? "pa dron"}
                </p>
              </div>
              <Badge variant="outline">{m.status}</Badge>
            </div>
          ))}
          {missions?.length === 0 && (
            <p className="text-sm text-muted-foreground">Ende s{"'"}ka misione.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}