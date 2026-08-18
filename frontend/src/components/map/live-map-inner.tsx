"use client";

import { useEffect, useState } from "react";
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

const LAYERS = {
  satellite: {
    label: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
  },
  streets: {
    label: "Rrugë",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  terrain: {
    label: "Terren",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap, OpenStreetMap",
  },
} as const;

type LayerKey = keyof typeof LAYERS;

function zonePoints(geoJson: string): [number, number][] {
  try {
    const parsed = JSON.parse(geoJson) as { coordinates: number[][][] };
    return parsed.coordinates[0].map(([lng, lat]) => [lat, lng]);
  } catch {
    return [];
  }
}

// Shenues qe rrotullohet sipas drejtimit — me hije qe te dallohet mbi satelit
function droneIcon(heading: number, hasWarning: boolean) {
  const color = hasWarning ? "#ff6b5b" : "#ff4fb0";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:34px;height:34px;
        display:flex;align-items:center;justify-content:center;
        transform: rotate(${heading}deg);
        transition: transform 0.6s ease-out;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,.6));
      ">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="${color}" opacity="0.25"/>
          <circle cx="12" cy="12" r="11" stroke="${color}" stroke-width="1" opacity="0.5" fill="none"/>
          <path d="M12 3 L17 19 L12 15.5 L7 19 Z"
                fill="${color}" stroke="#fff" stroke-width="1.4"
                stroke-linejoin="round"/>
        </svg>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function FitOnFirstLoad({ points }: { points: [number, number][] }) {
  const map = useMap();
  const hasPoints = points.length > 0;

  useEffect(() => {
    if (!hasPoints) return;
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 17 });
    // Vetem heren e pare — pastaj perdoruesi kontrollon harten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPoints]);

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
  const [layer, setLayer] = useState<LayerKey>("satellite");

  const points: [number, number][] = drones.map((d) => [d.latitude, d.longitude]);
  const center: [number, number] = points[0] ?? [42.66, 21.16];
  const active = LAYERS[layer];

  return (
    <>
      {/* Zgjedhesi i shtresave */}
      <div className="absolute right-4 top-4 z-[1000] flex gap-0.5 rounded-md border border-border bg-card/95 p-0.5 shadow-sm backdrop-blur">
        {(Object.keys(LAYERS) as LayerKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setLayer(k)}
            className={`cursor-pointer rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              layer === k
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {LAYERS[k].label}
          </button>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          key={layer}
          attribution={active.attribution}
          url={active.url}
          maxZoom={19}
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
                color: z.isRestricted ? "#ff4fb0" : "#4fdb9a",
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.12,
                dashArray: z.isRestricted ? "8 5" : undefined,
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
            <Tooltip direction="top" offset={[0, -16]}>
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
    </>
  );
}