"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone, DroneModel, PagedResult } from "@/lib/types";
import { qk } from "./keys";

export interface DroneFilter {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Listë me paginim — për faqen e dronëve */
export function useDronesPaged(filter: DroneFilter) {
  return useQuery({
    queryKey: [...qk.drones, "paged", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.search) params.set("search", filter.search);
      params.set("page", String(filter.page ?? 1));
      params.set("pageSize", String(filter.pageSize ?? 25));

      return (await api.get<PagedResult<Drone>>(`/drones?${params}`)).data;
    },
    placeholderData: (prev) => prev,
  });
}

/** Listë e plotë pa paginim — për dropdown-e dhe dashboard */
export function useDrones() {
  return useQuery({
    queryKey: [...qk.drones, "all"],
    queryFn: async () => (await api.get<Drone[]>("/drones/all")).data,
  });
}

export function useDrone(id: string) {
  return useQuery({
    queryKey: qk.drone(id),
    queryFn: async () => (await api.get<Drone>(`/drones/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      serialNumber: string;
      nickname: string | null;
      droneModelId: string;
      purchaseDate: string | null;
    }) => (await api.post<{ id: string }>("/drones", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.drones }),
  });
}

// ===== Modelet =====

export function useDroneModels() {
  return useQuery({
    queryKey: qk.droneModels,
    queryFn: async () => (await api.get<DroneModel[]>("/drone-models")).data,
  });
}

export function useCreateDroneModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      manufacturerName: string;
      modelName: string;
      maxFlightTimeMinutes: number;
      maxPayloadKg: number;
      maxSpeedKmh: number;
      cameraSpecs: string | null;
    }) => (await api.post<{ id: string }>("/drone-models", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.droneModels }),
  });
}