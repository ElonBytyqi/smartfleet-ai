"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DroneRisk, MissionAnalysis,ReportAnalysis  } from "@/lib/types";



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


export function useMissionAnalysis(missionId: string, enabled = true) {
  return useQuery({
    queryKey: ["ai", "anomalies", missionId],
    queryFn: async () =>
      (await api.get<MissionAnalysis>(`/ai/anomalies/missions/${missionId}`)).data,
    enabled: enabled && !!missionId,
    retry: false,
  });
}

export function useRecentAnomalies(days = 14) {
  return useQuery({
    queryKey: ["ai", "anomalies", "recent", days],
    queryFn: async () =>
      (await api.get<MissionAnalysis[]>(`/ai/anomalies/recent?days=${days}`)).data,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}


export function useReportAnalysis(reportId: string | null) {
  return useQuery({
    queryKey: ["ai", "report", reportId],
    queryFn: async () =>
      (await api.get<ReportAnalysis>(`/ai/reports/${reportId}/analysis`)).data,
    enabled: !!reportId,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
