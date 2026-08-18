"use client";

import { useState } from "react";
import { Users, ShieldCheck } from "lucide-react";
import {
  useUsers,
  useRoles,
  useUpdateUserRole,
  useSetUserActive,
} from "@/lib/queries";
import { ROLE_LABELS } from "@/lib/constants";
import { getApiError } from "@/lib/errors";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { ListCard } from "@/components/list-card";
import { ErrorBanner } from "@/components/error-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleColors: Record<string, string> = {
  Admin: "border-primary/30 bg-primary/10 text-primary",
  FleetManager: "border-[#4a6fa5]/40 bg-[#4a6fa5]/12 text-[#6b8fc7]",
  Pilot:
    "border-[var(--status-clear)]/30 bg-[var(--status-clear)]/10 text-[var(--status-clear)]",
  MaintenanceTechnician:
    "border-[var(--status-caution)]/30 bg-[var(--status-caution)]/10 text-[var(--status-caution)]",
  Operator: "border-border bg-muted text-muted-foreground",
};

export default function UsersPage() {
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useUsers();
  const { data: roles } = useRoles();
  const changeRole = useUpdateUserRole();
  const setActive = useSetUserActive();

  const users = data ?? [];
  const visible =
    filter === "all" ? users : users.filter((u) => u.roles.includes(filter));

  const inactive = users.filter((u) => !u.isActive).length;

  const filterOptions = [
    { key: "all", label: "Të gjithë" },
    ...(roles ?? []).map((r) => ({ key: r, label: ROLE_LABELS[r] ?? r })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Përdoruesit" count={users.length}>
        {inactive > 0 && (
          <span className="text-[13px] text-muted-foreground">
            {inactive} të çaktivizuar
          </span>
        )}
        <CreateUserDialog />
      </PageHeader>

      <FilterBar options={filterOptions} value={filter} onChange={setFilter} />

      <ErrorBanner message={error} />

      <ListCard
        isLoading={isLoading}
        isEmpty={visible.length === 0}
        emptyIcon={Users}
        emptyText="Nuk ka përdorues në këtë kategori."
      >
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
                  {ROLE_LABELS[r] ?? r}
                </span>
              ))}
            </div>

            <div className="w-44 shrink-0">
              <Select
                value={u.roles[0] ?? ""}
                onValueChange={(v) =>
                  changeRole.mutate(
                    { id: u.id, role: v },
                    {
                      onError: (e) =>
                        setError(getApiError(e, "Roli nuk u ndryshua.")),
                    }
                  )
                }
              >
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue placeholder="Ndrysho rolin" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-[100px] shrink-0 justify-end">
              <button
                onClick={() =>
                  setActive.mutate(
                    { id: u.id, isActive: !u.isActive },
                    {
                      onError: (e) =>
                        setError(getApiError(e, "Statusi nuk u ndryshua.")),
                    }
                  )
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
      </ListCard>
    </div>
  );
}