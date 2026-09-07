"use client";

import dynamic from "next/dynamic";
import type { Vertex } from "./draw-zone-map-inner";

const Inner = dynamic(() => import("./draw-zone-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="font-mono text-[12px] text-muted-foreground">
        Duke ngarkuar hartën...
      </p>
    </div>
  ),
});

export function DrawZoneMap(props: {
  vertices: Vertex[];
  onAdd: (v: Vertex) => void;
  onMove: (index: number, v: Vertex) => void;
  color?: string;
  center?: [number, number];
}) {
  return <Inner {...props} />;
}

export type { Vertex };