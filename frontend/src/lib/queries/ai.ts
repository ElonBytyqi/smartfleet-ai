"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DroneRisk } from "@/lib/types";

export function useFleetRisk() {
  return useQuery({
    queryKey: ["ai", "fleet-risk"],
    queryFn: async () =>
      (await api.get<DroneRisk[]>("/ai/predictive/fleet")).data,
    staleTime: 10 * 60 * 1000,
    retry: false,   // nese AI s'punon, mos provo perseri
  });
}

export function useRefreshFleetRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.get<DroneRisk[]>("/ai/predictive/fleet?refresh=true")).data,
    onSuccess: (data) => qc.setQueryData(["ai", "fleet-risk"], data),
  });
}

export function useAiHealth() {
  return useQuery({
    queryKey: ["ai", "health"],
    queryFn: async () =>
      (await api.get<{ available: boolean }>("/ai/health")).data,
    refetchInterval: 60_000,
    retry: false,
  });
}