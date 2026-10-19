"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "./keys";
import type { Alert, AlertFilter, PagedResult } from "@/lib/types";

const POLL_MS = 15_000;

/** Listë me paginim — për faqen e alerteve */
export function useAlertsPaged(filter: AlertFilter) {
  return useQuery({
    queryKey: [...qk.alerts, "paged", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.severity) params.set("severity", filter.severity);
      if (filter.droneId) params.set("droneId", filter.droneId);
      params.set("page", String(filter.page ?? 1));
      params.set("pageSize", String(filter.pageSize ?? 25));

      return (await api.get<PagedResult<Alert>>(`/alerts?${params}`)).data;
    },
    placeholderData: (prev) => prev,
    refetchInterval: POLL_MS,
  });
}

/** Vetëm aktivet — për badge-in te sidebar-i dhe dashboard-i */
export function useActiveAlerts() {
  return useQuery({
    queryKey: [...qk.alerts, "active"],
    queryFn: async () => (await api.get<Alert[]>("/alerts/active")).data,
    refetchInterval: POLL_MS,
  });
}

function useAlertAction(action: "acknowledge" | "resolve") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/alerts/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.alerts }),
  });
}

export const useAcknowledgeAlert = () => useAlertAction("acknowledge");
export const useResolveAlert = () => useAlertAction("resolve");