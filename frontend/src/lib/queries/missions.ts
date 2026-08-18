"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Mission, Waypoint, ConflictCheck } from "@/lib/types";
import { qk } from "./keys";

export function useMissions() {
  return useQuery({
    queryKey: qk.missions,
    queryFn: async () => (await api.get<Mission[]>("/missions")).data,
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