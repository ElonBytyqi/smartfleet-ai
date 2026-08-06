"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Battery, Certification, Drone } from "@/lib/types";
import { AlertTriangle, BatteryWarning, FileWarning, Wrench } from "lucide-react";
import Link from "next/link";

type Item = {
  icon: typeof AlertTriangle;
  text: string;
  detail: string;
  href: string;
  level: "warning" | "caution";
};

export function AttentionPanel() {
  const { data: batteries } = useQuery({
    queryKey: ["batteries"],
    queryFn: async () => (await api.get<Battery[]>("/batteries")).data,
  });

  const { data: certs } = useQuery({
    queryKey: ["expiring-certs"],
    queryFn: async () =>
      (await api.get<Certification[]>("/pilots/certifications/expiring?days=45")).data,
  });

  const { data: drones } = useQuery({
    queryKey: ["drones"],
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
  });

  const items: Item[] = [];

  batteries
    ?.filter((b) => b.healthPercentage < 80 || b.status === "NeedsReplacement")
    .forEach((b) =>
      items.push({
        icon: BatteryWarning,
        text: b.serialNumber,
        detail:
          b.status === "NeedsReplacement"
            ? "Kërkon zëvendësim"
            : `Shëndeti ${b.healthPercentage.toFixed(0)}%`,
        href: "/batteries",
        level: b.status === "NeedsReplacement" ? "warning" : "caution",
      })
    );

  certs?.forEach((c) =>
    items.push({
      icon: FileWarning,
      text: c.pilotName ?? "Pilot",
      detail: c.isExpired
        ? `${c.certificationType} ka skaduar`
        : `${c.certificationType} skadon për ${c.daysUntilExpiry} ditë`,
      href: "/pilots",
      level: c.isExpired ? "warning" : "caution",
    })
  );

  drones
    ?.filter((d) => d.status === "Grounded" || d.status === "Maintenance")
    .forEach((d) =>
      items.push({
        icon: Wrench,
        text: d.serialNumber,
        detail: d.status === "Grounded" ? "I ndaluar" : "Në mirëmbajtje",
        href: "/drones",
        level: d.status === "Grounded" ? "warning" : "caution",
      })
    );

  // Paralajmerimet e renda ne krye
  items.sort((a) => (a.level === "warning" ? -1 : 1));

  return (
    <section className="bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="font-heading text-sm font-semibold">Kërkon vëmendje</h2>
        </div>
        {items.length > 0 && (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          Gjithçka në rregull. Asnjë veprim i nevojshëm.
        </p>
      ) : (
        <div className="divide-y">
          {items.slice(0, 6).map((item, i) => {
            const Icon = item.icon;
            const color =
              item.level === "warning"
                ? "text-[var(--status-warning)]"
                : "text-[var(--status-caution)]";
            return (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 py-2.5 transition-colors first:pt-0 hover:text-primary"
              >
                <Icon className={`h-4 w-4 shrink-0 ${color}`} strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[12px]">{item.text}</p>
                  <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}