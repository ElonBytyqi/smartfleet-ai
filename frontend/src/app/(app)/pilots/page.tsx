"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Pilot, Certification } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { UserRound, FileWarning } from "lucide-react";

function CertificationList({ pilotId }: { pilotId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["certifications", pilotId],
    queryFn: async () =>
      (await api.get<Certification[]>(`/pilots/${pilotId}/certifications`)).data,
  });

  if (isLoading) {
    return (
      <p className="text-[13px] text-muted-foreground">Duke ngarkuar...</p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Ky pilot s'ka certifikata të regjistruara.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {data.map((c) => {
        const urgent = c.isExpired || c.daysUntilExpiry <= 30;
        return (
          <div key={c.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
            <div>
              <p className="text-[13px] font-medium">{c.certificationType}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {c.issuedBy} · lëshuar {c.issueDate}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-mono text-[12px] tabular-nums">{c.expiryDate}</p>
              <p
                className={`font-mono text-[11px] ${
                  c.isExpired
                    ? "text-[var(--status-warning)]"
                    : urgent
                      ? "text-[var(--status-caution)]"
                      : "text-muted-foreground"
                }`}
              >
                {c.isExpired
                  ? `skaduar para ${Math.abs(c.daysUntilExpiry)} ditësh`
                  : `${c.daysUntilExpiry} ditë`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PilotsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pilots"],
    queryFn: async () => (await api.get<Pilot[]>("/pilots")).data,
  });

  const { data: expiring } = useQuery({
    queryKey: ["expiring-certs"],
    queryFn: async () =>
      (await api.get<Certification[]>("/pilots/certifications/expiring?days=45")).data,
  });

  const pilots = data ?? [];
  const selected = pilots.find((p) => p.id === selectedId) ?? pilots[0];

 return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold">Pilotët</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {pilots.length}
          </span>
        </div>

        {expiring && expiring.length > 0 && (
          <div className="flex items-center gap-2 text-[var(--status-caution)]">
            <FileWarning className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[13px]">
              {expiring.length} certifikata skadojnë brenda 45 ditësh
            </span>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Lista */}
        <aside className="overflow-hidden rounded-lg border bg-card">
          {isLoading && (
            <p className="p-6 text-[13px] text-muted-foreground">
              Duke ngarkuar...
            </p>
          )}

          {!isLoading && pilots.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <UserRound
                className="h-8 w-8 text-muted-foreground/40"
                strokeWidth={1.5}
              />
              <p className="text-[13px] text-muted-foreground">
                Ende s&apos;ka pilotë të regjistruar.
              </p>
            </div>
          )}

          <div className="divide-y">
            {pilots.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full px-5 py-4 text-left transition-colors ${
                  selected?.id === p.id ? "bg-primary/8" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium">
                    {p.fullName ?? "Pilot"}
                  </p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {p.licenseNumber ?? "pa licencë"}
                </p>
                <div className="mt-1 flex gap-3 font-mono text-[11px] text-muted-foreground">
                  <span className="tabular-nums">
                    {p.totalFlightHours.toFixed(1)}h
                  </span>
                  <span>{p.certificationCount} certifikata</span>
                  {p.expiringCertificationCount > 0 && (
                    <span className="text-[var(--status-caution)]">
                      {p.expiringCertificationCount} skadojnë
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Detajet */}
        <div className="rounded-lg border bg-card p-6">
          {selected ? (
            <>
              <div className="mb-6">
                <h2 className="font-heading text-lg font-semibold">
                  {selected.fullName ?? "Pilot"}
                </h2>
                <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                  {selected.email} · {selected.licenseNumber ?? "pa licencë"}
                </p>
              </div>

              <div className="mb-8 grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Orë fluturimi",
                    value: selected.totalFlightHours.toFixed(1),
                  },
                  { label: "Certifikata", value: selected.certificationCount },
                  { label: "Skadojnë", value: selected.expiringCertificationCount },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="mt-1 font-mono text-xl font-medium tabular-nums">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              <h3 className="mb-3 font-heading text-sm font-semibold">
                Certifikatat
              </h3>
              <CertificationList pilotId={selected.id} />
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Zgjidh një pilot nga lista.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}