"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ReportFilter {
  from?: string;
  to?: string;
  droneId?: string;
  pilotId?: string;
  status?: string;
}

export interface ReportResult {
  title: string;
  subtitle: string;
  columns: string[];
  rows: string[][];
  summary: { label: string; value: string }[];
}

function toParams(f: ReportFilter) {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.droneId) p.set("droneId", f.droneId);
  if (f.pilotId) p.set("pilotId", f.pilotId);
  if (f.status) p.set("status", f.status);
  return p;
}

export function useReport(type: string, filter: ReportFilter) {
  return useQuery({
    queryKey: ["reports", type, filter],
    queryFn: async () =>
      (await api.get<ReportResult>(`/reports/${type}?${toParams(filter)}`)).data,
    placeholderData: (prev) => prev,
  });
}

/** Shkarkimi kalon përmes axios-it që token-i të shkojë me kërkesën. */
export async function downloadReport(
  type: string,
  format: "pdf" | "excel",
  filter: ReportFilter
) {
  const res = await api.get(`/reports/${type}/${format}?${toParams(filter)}`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    `smartfleet-${type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}` +
    (format === "pdf" ? ".pdf" : ".xlsx");
  a.click();
  URL.revokeObjectURL(url);
}