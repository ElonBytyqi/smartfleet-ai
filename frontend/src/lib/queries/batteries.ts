"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Battery, PagedResult } from "@/lib/types";
import { qk } from "./keys";

export interface BatteryFilter {
  droneId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Listë me paginim — për faqen e baterive */
export function useBatteriesPaged(filter: BatteryFilter) {
  return useQuery({
    queryKey: [...qk.batteries, "paged", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.droneId) params.set("droneId", filter.droneId);
      if (filter.status) params.set("status", filter.status);
      if (filter.search) params.set("search", filter.search);
      params.set("page", String(filter.page ?? 1));
      params.set("pageSize", String(filter.pageSize ?? 25));

      return (await api.get<PagedResult<Battery>>(`/batteries?${params}`)).data;
    },
    placeholderData: (prev) => prev,
  });
}

/** Listë e plotë — për dropdown-e dhe faqen e dronit */
export function useBatteries(droneId?: string) {
  return useQuery({
    queryKey: droneId ? qk.batteriesForDrone(droneId) : [...qk.batteries, "all"],
    queryFn: async () =>
      (
        await api.get<Battery[]>(
          droneId ? `/batteries/all?droneId=${droneId}` : "/batteries/all"
        )
      ).data,
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