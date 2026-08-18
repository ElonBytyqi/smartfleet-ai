"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { qk } from "./keys";

export function useUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: async () => (await api.get<User[]>("/users")).data,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: qk.roles,
    queryFn: async () => (await api.get<string[]>("/users/roles")).data,
    staleTime: 60 * 60 * 1000,   // rolet nuk ndryshojne shpesh
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.users });
  qc.invalidateQueries({ queryKey: qk.pilots });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fullName: string;
      email: string;
      password: string;
      role: string;
      phoneNumber: string | null;
    }) => (await api.post<{ id: string }>("/users", body)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      api.put(`/users/${id}/roles`, { roles: [role] }),
    onSuccess: () => invalidate(qc),
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}/status`, isActive, {
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => invalidate(qc),
  });
}