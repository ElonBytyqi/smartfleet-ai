"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MaintenanceRecord, PagedResult } from "@/lib/types";
import { qk } from "./keys";

export interface MaintenanceFilter {
  droneId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Listë me paginim — për faqen e mirëmbajtjes */
export function useMaintenancePaged(filter: MaintenanceFilter) {
  return useQuery({
    queryKey: [...qk.maintenance, "paged", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.droneId) params.set("droneId", filter.droneId);
      if (filter.status) params.set("status", filter.status);
      if (filter.search) params.set("search", filter.search);
      params.set("page", String(filter.page ?? 1));
      params.set("pageSize", String(filter.pageSize ?? 25));

      return (
        await api.get<PagedResult<MaintenanceRecord>>(`/maintenance?${params}`)
      ).data;
    },
    placeholderData: (prev) => prev,
  });
}

/** Listë e plotë — për faqen e dronit */
export function useMaintenance(droneId?: string) {
  return useQuery({
    queryKey: droneId
      ? [...qk.maintenance, "all", droneId]
      : [...qk.maintenance, "all"],
    queryFn: async () =>
      (
        await api.get<MaintenanceRecord[]>(
          droneId ? `/maintenance/all?droneId=${droneId}` : "/maintenance/all"
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