"use client";

import dynamic from "next/dynamic";
import { LiveDrone } from "@/lib/use-telemetry";
import { FlightZone } from "@/lib/types";

const Inner = dynamic(() => import("./live-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="font-mono text-[12px] text-muted-foreground">
        Duke ngarkuar hartën...
      </p>
    </div>
  ),
});

export function LiveMap(props: {
  drones: LiveDrone[];
  zones: FlightZone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  followTarget: [number, number] | null;
}) {
  return <Inner {...props} />;
}