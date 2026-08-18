"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone } from "@/lib/types";
import { qk } from "./keys";

export function useDrones() {
  return useQuery({
    queryKey: qk.drones,
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
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