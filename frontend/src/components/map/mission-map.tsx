"use client";

import dynamic from "next/dynamic";
import { FlightZone } from "@/lib/types";
import type { MapPoint } from "./mission-map-inner";

const Inner = dynamic(() => import("./mission-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="font-mono text-[12px] text-muted-foreground">
        Duke ngarkuar hartën...
      </p>
    </div>
  ),
});

export function MissionMap(props: {
  zone: FlightZone | undefined;
  points: MapPoint[];
  editable: boolean;
  onAdd?: (lat: number, lng: number) => void;
  onMove?: (index: number, lat: number, lng: number) => void;
}) {
  return <Inner {...props} />;
}

export type { MapPoint };