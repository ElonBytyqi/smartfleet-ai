"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DroneComponent } from "@/lib/types";

export const componentKeys = {
  all: (droneId: string) => ["components", droneId] as const,
};

export function useDroneComponents(droneId: string) {
  return useQuery({
    queryKey: componentKeys.all(droneId),
    queryFn: async () =>
      (await api.get<DroneComponent[]>(`/drones/${droneId}/components`)).data,
    enabled: !!droneId,
  });
}

export function useAddComponent(droneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      componentType: string;
      serialNumber: string | null;
      installedAt: string;
      expectedLifespanHours: number | null;
    }) => api.post(`/drones/${droneId}/components`, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: componentKeys.all(droneId) }),
  });
}

export function useUpdateComponent(droneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      componentId,
      ...body
    }: {
      componentId: string;
      componentType: string;
      serialNumber: string | null;
      expectedLifespanHours: number | null;
      status: string;
    }) => api.put(`/drones/${droneId}/components/${componentId}`, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: componentKeys.all(droneId) }),
  });
}