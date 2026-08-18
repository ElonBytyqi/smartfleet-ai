"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Pilot, Certification } from "@/lib/types";
import { THRESHOLDS } from "@/lib/constants";
import { qk } from "./keys";

export function usePilots() {
  return useQuery({
    queryKey: qk.pilots,
    queryFn: async () => (await api.get<Pilot[]>("/pilots")).data,
  });
}

export function useCertifications(pilotId: string) {
  return useQuery({
    queryKey: qk.certifications(pilotId),
    queryFn: async () =>
      (await api.get<Certification[]>(`/pilots/${pilotId}/certifications`)).data,
    enabled: !!pilotId,
  });
}

export function useExpiringCertifications(days = THRESHOLDS.certificationExpiryDays) {
  return useQuery({
    queryKey: qk.expiringCerts,
    queryFn: async () =>
      (
        await api.get<Certification[]>(
          `/pilots/certifications/expiring?days=${days}`
        )
      ).data,
  });
}

export function useAddCertification(pilotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      certificationType: string;
      issuedBy: string;
      issueDate: string;
      expiryDate: string;
      documentUrl: string | null;
    }) => api.post(`/pilots/${pilotId}/certifications`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.certifications(pilotId) });
      qc.invalidateQueries({ queryKey: qk.expiringCerts });
      qc.invalidateQueries({ queryKey: qk.pilots });
    },
  });
}