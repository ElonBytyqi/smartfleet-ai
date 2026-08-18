"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Battery } from "@/lib/types";
import { qk } from "./keys";

export function useBatteries(droneId?: string) {
  return useQuery({
    queryKey: droneId ? qk.batteriesForDrone(droneId) : qk.batteries,
    queryFn: async () =>
      (await api.get<Battery[]>(droneId ? `/batteries?droneId=${droneId}` : "/batteries"))
        .data,
  });
}

export function useAssignBattery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, droneId }: { id: string; droneId: string | null }) =>
      api.post(`/batteries/${id}/assign`, { droneId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batteries });
      qc.invalidateQueries({ queryKey: qk.drones });
    },
  });
}

export function useUpdateBatteryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: number }) =>
      api.patch(`/batteries/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batteries });
      qc.invalidateQueries({ queryKey: qk.drones });
    },
  });
}

export function useCreateBattery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      serialNumber: string;
      capacityMah: number;
      droneId: string | null;
      purchaseDate: string | null;
    }) => (await api.post<{ id: string }>("/batteries", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.batteries }),
  });
}