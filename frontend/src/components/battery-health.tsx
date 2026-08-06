"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Battery } from "@/lib/types";
import { BatteryMedium } from "lucide-react";

export function BatteryHealth() {
  const { data } = useQuery({
    queryKey: ["batteries"],
    queryFn: async () => (await api.get<Battery[]>("/batteries")).data,
  });

  const sorted = [...(data ?? [])].sort(
    (a, b) => a.healthPercentage - b.healthPercentage
  );

  function barColor(h: number) {
    if (h < 70) return "var(--status-warning)";
    if (h < 85) return "var(--status-caution)";
    return "var(--status-clear)";
  }

  return (
    <section className="bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <BatteryMedium className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="font-heading text-sm font-semibold">Shëndeti i baterive</h2>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          Ende s{"'"}ka bateri të regjistruara.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, 6).map((b) => (
            <div key={b.id}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-mono text-[12px]">{b.serialNumber}</span>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {b.healthPercentage.toFixed(0)}% · {b.cycleCount} cikle
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${b.healthPercentage}%`,
                    background: barColor(b.healthPercentage),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}