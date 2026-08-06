"use client";

import dynamic from "next/dynamic";
import { FlightZone } from "@/lib/types";

// ssr:false — Leaflet prek window, s'mund te renderohet ne server
const ZoneMapInner = dynamic(() => import("./zone-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="font-mono text-[12px] text-muted-foreground">
        Duke ngarkuar hartën...
      </p>
    </div>
  ),
});

export function ZoneMap(props: {
  zones: FlightZone[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return <ZoneMapInner {...props} />;
}