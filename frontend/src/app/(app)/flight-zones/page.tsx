"use client";

import { useState } from "react";
import { MapPinned, ShieldAlert } from "lucide-react";
import { useFlightZones } from "@/lib/queries";
import { TYPE_LABELS } from "@/lib/constants";
import { ZoneMap } from "@/components/map/zone-map";
import { PageHeader } from "@/components/page-header";

export default function FlightZonesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useFlightZones();

  const zones = data ?? [];
  const restricted = zones.filter((z) => z.isRestricted).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Zonat e fluturimit" count={zones.length}>
        {restricted > 0 && (
          <div className="flex items-center gap-2 text-[var(--status-caution)]">
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[13px]">{restricted} të kufizuara</span>
          </div>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Lista */}
        <aside className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border bg-card">
          {isLoading && (
            <p className="p-6 text-[13px] text-muted-foreground">
              Duke ngarkuar...
            </p>
          )}

          {!isLoading && zones.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <MapPinned
                className="h-8 w-8 text-muted-foreground/40"
                strokeWidth={1.5}
              />
              <p className="text-[13px] text-muted-foreground">
                Ende s&apos;ka zona të regjistruara.
              </p>
            </div>
          )}

          <div className="divide-y">
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelectedId(z.id)}
                className={`w-full cursor-pointer px-5 py-4 text-left transition-colors ${
                  selectedId === z.id ? "bg-primary/8" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium">{z.name}</p>
                  {z.isRestricted && (
                    <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                      Kufizuar
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {TYPE_LABELS[z.zoneType] ?? z.zoneType}
                  {z.maxAltitudeMeters && ` · max ${z.maxAltitudeMeters} m`}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {z.missionCount} misione
                </p>
              </button>
            ))}
          </div>
        </aside>

        {/* Harta */}
        <div className="relative h-[calc(100vh-220px)] overflow-hidden rounded-lg border bg-card">
          {zones.length > 0 && (
            <ZoneMap
              zones={zones}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>
    </div>
  );
}