"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FlightZone } from "@/lib/types";
import { ZoneMap } from "@/components/map/zone-map";
import { MapPinned, ShieldAlert } from "lucide-react";

export default function FlightZonesPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["flight-zones"],
        queryFn: async () => (await api.get<FlightZone[]>("/flight-zones")).data,
    });

    const zones = data ?? [];
    const restricted = zones.filter((z) => z.isRestricted).length;

   return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold">
            Zonat e fluturimit
          </h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {zones.length}
          </span>
        </div>

        {restricted > 0 && (
          <div className="flex items-center gap-2 text-[var(--status-caution)]">
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[13px]">{restricted} të kufizuara</span>
          </div>
        )}
      </header>

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
                className={`w-full px-5 py-4 text-left transition-colors ${
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
                  {z.zoneType}
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
        <div className="h-[calc(100vh-220px)] overflow-hidden rounded-lg border bg-card">
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