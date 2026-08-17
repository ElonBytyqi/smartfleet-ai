"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { CreateUserDialog } from "@/components/create-user-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ShieldCheck } from "lucide-react";

const roleLabels: Record<string, string> = {
  Admin: "Administrator",
  FleetManager: "Menaxher flote",
  Pilot: "Pilot",
  MaintenanceTechnician: "Teknik",
  Operator: "Operator",
};

const roleColors: Record<string, string> = {
  Admin: "border-primary/30 bg-primary/10 text-primary",
  FleetManager: "border-[#4a6fa5]/40 bg-[#4a6fa5]/12 text-[#6b8fc7]",
  Pilot: "border-[var(--status-clear)]/30 bg-[var(--status-clear)]/10 text-[var(--status-clear)]",
  MaintenanceTechnician:
    "border-[var(--status-caution)]/30 bg-[var(--status-caution)]/10 text-[var(--status-caution)]",
  Operator: "border-border bg-muted text-muted-foreground",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<User[]>("/users")).data,
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<string[]>("/users/roles")).data,
  });

  const setActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}/status`, isActive, {
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Statusi nuk u ndryshua.")),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      api.put(`/users/${id}/roles`, { roles: [role] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["pilots"] });
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Roli nuk u ndryshua.")),
  });

  const users = data ?? [];
  const visible =
    filter === "all" ? users : users.filter((u) => u.roles.includes(filter));

  const inactive = users.filter((u) => !u.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold">Përdoruesit</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {users.length}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {inactive > 0 && (
            <span className="text-[13px] text-muted-foreground">
              {inactive} të çaktivizuar
            </span>
          )}
          <CreateUserDialog />
        </div>
      </header>

      <div className="flex gap-1 rounded-lg border bg-card px-4 py-3">
        <button
          onClick={() => setFilter("all")}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-[13px] transition-colors ${
            filter === "all"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Të gjithë
        </button>
        {roles?.map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-[13px] transition-colors ${
              filter === r
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {roleLabels[r] ?? r}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 px-6 py-3">
          <p className="text-[13px] text-[var(--status-warning)]">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        {isLoading && (
          <p className="p-12 text-center text-[13px] text-muted-foreground">
            Duke ngarkuar...
          </p>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-16">
            <Users className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-[13px] text-muted-foreground">
              Nuk ka përdorues në këtë kategori.
            </p>
          </div>
        )}

        <div className="divide-y">
          {visible.map((u) => (
            <div
              key={u.id}
              className={`flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40 ${
                !u.isActive ? "opacity-55" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-medium">{u.fullName}</p>
                  {u.hasPilotProfile && (
                    <ShieldCheck
                      className="h-3.5 w-3.5 shrink-0 text-[var(--status-clear)]"
                      strokeWidth={2}
                    />
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {u.email}
                  {u.phoneNumber && ` · ${u.phoneNumber}`}
                </p>
              </div>

              <div className="hidden w-40 shrink-0 md:flex md:flex-wrap md:gap-1">
                {u.roles.map((r) => (
                  <span
                    key={r}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      roleColors[r] ?? "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {roleLabels[r] ?? r}
                  </span>
                ))}
              </div>

              <div className="w-44 shrink-0">
                <Select
                  value={u.roles[0] ?? ""}
                  onValueChange={(v) => changeRole.mutate({ id: u.id, role: v })}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue placeholder="Ndrysho rolin" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabels[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex w-[100px] shrink-0 justify-end">
                <button
                  onClick={() =>
                    setActive.mutate({ id: u.id, isActive: !u.isActive })
                  }
                  disabled={setActive.isPending}
                  className={`h-7 w-[92px] cursor-pointer rounded-md border text-[12px] font-medium transition-colors disabled:opacity-50 ${
                    u.isActive
                      ? "border-[var(--status-warning)]/40 bg-transparent text-[var(--status-warning)] hover:bg-[var(--status-warning)]/10"
                      : "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {u.isActive ? "Çaktivizo" : "Aktivizo"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}