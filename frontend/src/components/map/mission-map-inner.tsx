"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { FlightZone } from "@/lib/types";
import "leaflet/dist/leaflet.css";

export type MapPoint = { lat: number; lng: number; alt: number | null };

function toLatLng(geoJson: string): [number, number][] {
  try {
    const parsed = JSON.parse(geoJson) as { coordinates: number[][][] };
    return parsed.coordinates[0].map(([lng, lat]) => [lat, lng]);
  } catch {
    return [];
  }
}

// Shenues i numeruar — SVG inline, pa varesi nga ikonat e Leaflet
function numberedIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:var(--primary);color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-family:var(--font-mono);font-size:11px;font-weight:500;
      border:2px solid var(--card);box-shadow:0 1px 4px rgba(0,0,0,.3);
    ">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }, [map, points]);
  return null;
}

function ClickHandler({ onAdd }: { onAdd?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAdd?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MissionMapInner({
  zone,
  points,
  editable,
  onAdd,
  onMove,
}: {
  zone: FlightZone | undefined;
  points: MapPoint[];
  editable: boolean;
  onAdd?: (lat: number, lng: number) => void;
  onMove?: (index: number, lat: number, lng: number) => void;
}) {
  const zonePoints = zone ? toLatLng(zone.polygonGeoJson) : [];
  const route: [number, number][] = points.map((p) => [p.lat, p.lng]);
  const fitTarget = route.length > 0 ? route : zonePoints;
  const center: [number, number] = fitTarget[0] ?? [42.66, 21.16];

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      <FitBounds points={fitTarget} />
      {editable && <ClickHandler onAdd={onAdd} />}

      {zonePoints.length > 0 && (
        <Polygon
          positions={zonePoints}
          pathOptions={{
            color: zone?.isRestricted ? "#b0257a" : "#3d9970",
            weight: 1.5,
            fillOpacity: 0.08,
            dashArray: zone?.isRestricted ? "6 4" : undefined,
          }}
        />
      )}

      {route.length > 1 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "var(--primary)", weight: 2, opacity: 0.7 }}
        />
      )}

      {points.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={numberedIcon(i + 1)}
          draggable={editable}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onMove?.(i, lat, lng);
            },
          }}
        >
          <Tooltip>
            <span className="font-mono">
              {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
              {p.alt !== null && ` · ${p.alt} m`}
            </span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}