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

export interface TrackPoint {
  droneId: string;
  missionId: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  groundSpeedMs: number;
  batteryPercentage: number;
}

export function useMissionTrack(missionId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["mission-track", missionId],
    queryFn: async () =>
      (await api.get<TrackPoint[]>(`/telemetry/missions/${missionId}/track`)).data,
    enabled: !!missionId && enabled,
    refetchInterval: 5_000,   // rifreskon rrugen ndersa droni fluturon
  });
}