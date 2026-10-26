"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Setting {
  id: string;
  key: string;
  value: string;
  defaultValue: string;
  valueType: string;
  category: string;
  label: string;
  description: string | null;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  isModified: boolean;
  updatedAt: string | null;
}

export interface SettingGroup {
  category: string;
  settings: Setting[];
}

const key = ["settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<SettingGroup[]>("/settings")).data,
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, string>) =>
      api.put("/settings", { values }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useResetSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settingKey: string) =>
      api.post(`/settings/${settingKey}/reset`),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}