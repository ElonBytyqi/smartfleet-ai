"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FlightZone } from "@/lib/types";
import { qk } from "./keys";

export function useFlightZones() {
  return useQuery({
    queryKey: qk.flightZones,
    queryFn: async () => (await api.get<FlightZone[]>("/flight-zones")).data,
  });
}

export function useCreateFlightZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      zoneType: string;
      polygonGeoJson: string;
      isRestricted: boolean;
      maxAltitudeMeters: number | null;
    }) => (await api.post<{ id: string }>("/flight-zones", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.flightZones }),
  });
}

export function useDeleteFlightZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/flight-zones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.flightZones }),
  });
}