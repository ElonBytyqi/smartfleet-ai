"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AuditLog, PagedResult } from "@/lib/types";

export interface AuditFilter {
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function useAuditLogs(filter: AuditFilter) {
  return useQuery({
    queryKey: ["audit-logs", filter],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filter.entityType) params.set("entityType", filter.entityType);
      if (filter.action) params.set("action", filter.action);
      if (filter.from) params.set("from", filter.from);
      if (filter.to) params.set("to", filter.to);
      params.set("page", String(filter.page ?? 1));
      params.set("pageSize", String(filter.pageSize ?? 50));

      return (await api.get<PagedResult<AuditLog>>(`/audit-logs?${params}`)).data;
    },
    placeholderData: (prev) => prev,   // mban te dhenat gjate ndryshimit te faqes
  });
}

export function useAuditEntityTypes() {
  return useQuery({
    queryKey: ["audit-entity-types"],
    queryFn: async () =>
      (await api.get<string[]>("/audit-logs/entity-types")).data,
    staleTime: 10 * 60 * 1000,
  });
}