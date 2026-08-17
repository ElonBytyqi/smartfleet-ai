"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { LiveDrone } from "@/lib/use-telemetry";
import { FlightZone } from "@/lib/types";
import "leaflet/dist/leaflet.css";

function zonePoints(geoJson: string): [number, number][] {
  try {
    const parsed = JSON.parse(geoJson) as { coordinates: number[][][] };
    return parsed.coordinates[0].map(([lng, lat]) => [lat, lng]);
  } catch {
    return [];
  }
}

// Shenues qe rrotullohet sipas drejtimit te fluturimit
function droneIcon(heading: number, hasWarning: boolean) {
  const color = hasWarning ? "var(--status-warning)" : "var(--primary)";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:30px;height:30px;
        display:flex;align-items:center;justify-content:center;
        transform: rotate(${heading}deg);
        transition: transform 0.6s ease-out;
      ">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="${color}" opacity="0.18"/>
          <path d="M12 3 L17 19 L12 15.5 L7 19 Z"
                fill="${color}" stroke="var(--card)" stroke-width="1.2"
                stroke-linejoin="round"/>
        </svg>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function FitOnFirstLoad({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [80, 80], maxZoom: 15 });
    // Vetem heren e pare — pastaj perdoruesi kontrollon harten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length > 0]);
  return null;
}

function FollowDrone({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.panTo(target, { animate: true, duration: 0.8 });
  }, [map, target]);
  return null;
}

export default function LiveMapInner({
  drones,
  zones,
  selectedId,
  onSelect,
  followTarget,
}: {
  drones: LiveDrone[];
  zones: FlightZone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  followTarget: [number, number] | null;
}) {
  const points: [number, number][] = drones.map((d) => [d.latitude, d.longitude]);
  const center: [number, number] = points[0] ?? [42.66, 21.16];

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      <FitOnFirstLoad points={points} />
      <FollowDrone target={followTarget} />

      {zones.map((z) => {
        const pts = zonePoints(z.polygonGeoJson);
        if (pts.length === 0) return null;
        return (
          <Polygon
            key={z.id}
            positions={pts}
            pathOptions={{
              color: z.isRestricted ? "#b0257a" : "#3d9970",
              weight: 1,
              fillOpacity: 0.05,
              dashArray: z.isRestricted ? "6 4" : undefined,
            }}
          />
        );
      })}

      {drones.map((d) => (
        <Marker
          key={d.droneId}
          position={[d.latitude, d.longitude]}
          icon={droneIcon(d.headingDegrees, d.warnings.length > 0)}
          eventHandlers={{ click: () => onSelect(d.droneId) }}
          zIndexOffset={selectedId === d.droneId ? 1000 : 0}
        >
          <Tooltip direction="top" offset={[0, -14]}>
            <span className="font-mono text-[11px]">
              {d.serialNumber}
              {d.nickname && ` · ${d.nickname}`}
              <br />
              {d.altitudeMeters.toFixed(0)} m · {d.groundSpeedMs.toFixed(1)} m/s ·{" "}
              {d.batteryPercentage.toFixed(0)}%
            </span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}