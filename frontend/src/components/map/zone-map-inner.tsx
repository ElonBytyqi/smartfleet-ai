"use client";

import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import { FlightZone } from "@/lib/types";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";


function MapController({
  shapes,
  selectedId,
}: {
  shapes: { zone: FlightZone; points: [number, number][] }[];
  selectedId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (shapes.length === 0) return;

    const target = selectedId
      ? shapes.find((s) => s.zone.id === selectedId)
      : null;

    if (target) {
      map.flyToBounds(L.latLngBounds(target.points), {
        padding: [60, 60],
        duration: 0.6,
      });
    } else {
      const all = shapes.flatMap((s) => s.points);
      map.fitBounds(L.latLngBounds(all), { padding: [40, 40] });
    }
  }, [map, shapes, selectedId]);

  return null;
}

// GeoJSON i ruan si [lng, lat]; Leaflet i pret si [lat, lng]
function toLatLng(geoJson: string): [number, number][] {
  try {
    const parsed = JSON.parse(geoJson) as {
      type: string;
      coordinates: number[][][];
    };
    return parsed.coordinates[0].map(([lng, lat]) => [lat, lng]);
  } catch {
    return [];
  }
}

export default function ZoneMapInner({
  zones,
  selectedId,
  onSelect,
}: {
  zones: FlightZone[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const shapes = zones
    .map((z) => ({ zone: z, points: toLatLng(z.polygonGeoJson) }))
    .filter((s) => s.points.length > 0);

  // Qendra: pika e pare e zones se pare, ose Prishtina
  const center: [number, number] = shapes[0]?.points[0] ?? [42.66, 21.16];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "var(--muted)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapController shapes={shapes} selectedId={selectedId} />

      {shapes.map(({ zone, points }) => {
        const active = selectedId === zone.id;
        // Magenta per zonat e kufizuara — konventa e hartave ajrore
        const color = zone.isRestricted ? "#b0257a" : "#3d9970";
        return (
          <Polygon
            key={zone.id}
            positions={points}
            pathOptions={{
              color,
              weight: active ? 3 : 1.5,
              fillOpacity: active ? 0.28 : 0.12,
              dashArray: zone.isRestricted ? "6 4" : undefined,
            }}
            eventHandlers={{ click: () => onSelect?.(zone.id) }}
          >
            <Tooltip sticky>
              <span className="font-medium">{zone.name}</span>
              <br />
              {zone.zoneType}
              {zone.isRestricted && " · e kufizuar"}
              {zone.maxAltitudeMeters && ` · max ${zone.maxAltitudeMeters} m`}
            </Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}