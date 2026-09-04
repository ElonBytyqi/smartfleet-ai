"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";
import { bearing } from "@/lib/geo";

type LatLng = [number, number];

/**
 * Vendos shigjeta përgjatë rrugës, në largësi të barabartë,
 * secila e rrotulluar sipas drejtimit të segmentit.
 */
function arrowIcon(deg: number, color: string, delay: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:16px;height:16px;
        display:flex;align-items:center;justify-content:center;
        transform: rotate(${deg}deg);
        animation: arrow-pulse 1.8s ease-in-out infinite;
        animation-delay: ${delay}s;
      ">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1 L10 10 L6 7.5 L2 10 Z"
                fill="${color}"
                stroke="rgba(0,0,0,.35)" stroke-width="0.5"
                stroke-linejoin="round"/>
        </svg>
      </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/** Gjatësia e përafërt e një segmenti në gradë (mjafton për ndarje proporcionale) */
function roughLength(a: LatLng, b: LatLng): number {
  const dLat = b[0] - a[0];
  const dLng = (b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function RouteArrows({
  path,
  color,
  spacing = 60,
  opacity = 1,
}: {
  path: LatLng[];
  color: string;
  /** Sa pika largësi mes shigjetave */
  spacing?: number;
  opacity?: number;
}) {
  if (path.length < 2) return null;

  const arrows: { pos: LatLng; deg: number; delay: number }[] = [];

  for (let i = spacing; i < path.length - 1; i += spacing) {
    const from = path[i];
    const to = path[Math.min(i + 3, path.length - 1)];

    if (roughLength(from, to) < 1e-7) continue;

    arrows.push({
      pos: from,
      deg: bearing({ lat: from[0], lng: from[1] }, { lat: to[0], lng: to[1] }),
      // Vonesa progresive krijon ndjesine e rrjedhes
      delay: (arrows.length % 5) * 0.28,
    });
  }

  return (
    <>
      {arrows.map((a, i) => (
        <Marker
          key={i}
          position={a.pos}
          icon={arrowIcon(a.deg, color, a.delay)}
          interactive={false}
          opacity={opacity}
        />
      ))}
    </>
  );
}