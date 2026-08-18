"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MaintenanceRecord } from "@/lib/types";
import { qk } from "./keys";

export function useMaintenance(droneId?: string) {
  return useQuery({
    queryKey: droneId ? [...qk.maintenance, droneId] : qk.maintenance,
    queryFn: async () =>
      (
        await api.get<MaintenanceRecord[]>(
          droneId ? `/maintenance?droneId=${droneId}` : "/maintenance"
        )
      ).data,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.maintenance });
  qc.invalidateQueries({ queryKey: qk.drones });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      droneId: string;
      maintenanceType: number;
      description: string;
      cost: number | null;
    }) => (await api.post<{ id: string }>("/maintenance", body)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useStartMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.post(`/maintenance/${id}/start`),
    onSuccess: () => invalidate(qc),
  });
}

export function useCompleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      cost: number | null;
      nextRecommendedDate: string | null;
      returnDroneToService: boolean;
    }) => api.post(`/maintenance/${id}/complete`, body),
    onSuccess: () => invalidate(qc),
  });
}