"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LiveDrone } from "@/lib/use-telemetry";
import { qk } from "./keys";

export function useLiveFleet() {
  return useQuery({
    queryKey: qk.liveFleet,
    queryFn: async () => (await api.get<LiveDrone[]>("/telemetry/live")).data,
    refetchInterval: 30_000,   // rezerve nese SignalR bie
  });
}