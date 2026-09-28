"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Mission, Waypoint, ConflictCheck, PagedResult } from "@/lib/types";
import { qk } from "./keys";

export interface MissionFilter {
  status?: string;
  droneId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Listë me paginim — për faqen e misioneve */
export function useMissionsPaged(filter: MissionFilter) {
  return useQuery({
    queryKey: [...qk.missions, "paged", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.droneId) params.set("droneId", filter.droneId);
      if (filter.search) params.set("search", filter.search);
      params.set("page", String(filter.page ?? 1));
      params.set("pageSize", String(filter.pageSize ?? 25));

      return (await api.get<PagedResult<Mission>>(`/missions?${params}`)).data;
    },
    placeholderData: (prev) => prev,
  });
}

/** Listë e plotë pa paginim — për dashboard dhe faqen e dronit */
export function useMissions(droneId?: string) {
  return useQuery({
    queryKey: droneId
      ? [...qk.missions, "all", droneId]
      : [...qk.missions, "all"],
    queryFn: async () =>
      (
        await api.get<Mission[]>(
          droneId ? `/missions/all?droneId=${droneId}` : "/missions/all"
        )
      ).data,
  });
}

export function useMission(id: string) {
  return useQuery({
    queryKey: qk.mission(id),
    queryFn: async () => (await api.get<Mission>(`/missions/${id}`)).data,
    enabled: !!id,
  });
}

export function useWaypoints(missionId: string) {
  return useQuery({
    queryKey: qk.waypoints(missionId),
    queryFn: async () =>
      (await api.get<Waypoint[]>(`/missions/${missionId}/waypoints`)).data,
    enabled: !!missionId,
  });
}

// Veprimet e state machine-it prekin edhe dronet dhe bateritë
function invalidateAfterAction(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: qk.missions });
  qc.invalidateQueries({ queryKey: qk.drones });
  qc.invalidateQueries({ queryKey: qk.batteries });
  if (id) qc.invalidateQueries({ queryKey: qk.mission(id) });
}

export function useMissionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) =>
      api.post(`/missions/${id}/${action}`),
    onSuccess: (_, vars) => invalidateAfterAction(qc, vars.id),
  });
}

export function useAssignResources(missionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      droneId: string;
      batteryId: string;
      pilotId: string | null;
    }) => api.post(`/missions/${missionId}/assign`, body),
    onSuccess: () => invalidateAfterAction(qc, missionId),
  });
}

export function useCheckConflicts(missionId: string) {
  return useMutation({
    mutationFn: async () =>
      (await api.get<ConflictCheck>(`/missions/${missionId}/conflicts`)).data,
  });
}

export function useSaveWaypoints(missionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      waypoints: {
        sequenceNumber: number;
        latitude: number;
        longitude: number;
        altitudeMeters: number | null;
        actionType: string | null;
      }[]
    ) => api.put(`/missions/${missionId}/waypoints`, waypoints),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.waypoints(missionId) });
      qc.invalidateQueries({ queryKey: qk.mission(missionId) });
    },
  });
}

export function useCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      missionType: string;
      flightZoneId: string;
      scheduledStart: string;
      scheduledEnd: string | null;
      isAutonomous: boolean;
    }) => (await api.post<{ id: string }>("/missions", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.missions }),
  });
}