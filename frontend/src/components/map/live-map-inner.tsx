"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { LiveDrone } from "@/lib/use-telemetry";
import { FlightZone } from "@/lib/types";
import { droneColor } from "@/lib/drone-colors";
import { project } from "@/lib/geo";
import { smoothPath, fadeSegments, splitAtWaypoint } from "@/lib/smooth-path";
import { RouteArrows } from "./route-arrows";
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

export interface TrackLine {
  droneId: string;
  points: [number, number][];
}

export interface PlannedRoute {
  droneId: string;
  waypoints: { lat: number; lng: number; seq: number }[];
  nextIndex: number;
}

function zonePoints(geoJson: string): [number, number][] {
  try {
    const parsed = JSON.parse(geoJson) as { coordinates: number[][][] };
    return parsed.coordinates[0].map(([lng, lat]) => [lat, lng]);
  } catch {
    return [];
  }
}

// Kuadrikopter qe rrotullohet sipas drejtimit
function droneIcon(heading: number, color: string, hasWarning: boolean, selected: boolean) {
  const size = selected ? 54 : 46;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        transform: rotate(${heading}deg);
        transition: transform 0.7s ease-out;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,.7));
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="${color}" opacity="${selected ? 0.14 : 0.07}"/>
          ${selected ? `<circle cx="20" cy="20" r="18" stroke="${color}" stroke-width="1" opacity="0.5" fill="none"/>` : ""}

          <path d="M20 20 L11 11 M20 20 L29 11 M20 20 L11 29 M20 20 L29 29"
                stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>

          <circle cx="11" cy="11" r="5.2" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.75"/>
          <circle cx="29" cy="11" r="5.2" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.75"/>
          <circle cx="11" cy="29" r="5.2" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.75"/>
          <circle cx="29" cy="29" r="5.2" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.75"/>

          <circle cx="20" cy="20" r="6" fill="${color}" stroke="#fff" stroke-width="1.6"/>
          <path d="M20 13.5 L22.6 18 L17.4 18 Z" fill="#fff"/>

          ${
            hasWarning
              ? `<circle cx="32" cy="8" r="4.5" fill="#ff5c5c" stroke="#fff" stroke-width="1.3"/>
                 <path d="M32 5.8 L32 9 M32 10.3 L32 10.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`
              : ""
          }
        </svg>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Waypoint me tri gjendje: i kaluar, i ardhshmi, ne pritje
function waypointIcon(
  seq: number,
  color: string,
  state: "passed" | "next" | "upcoming"
) {
  const size = state === "next" ? 26 : 20;

  const bg =
    state === "next"
      ? color
      : state === "passed"
        ? "rgba(0,0,0,.4)"
        : "rgba(0,0,0,.6)";

  const border =
    state === "next" ? "#fff" : state === "passed" ? "rgba(255,255,255,.25)" : color;

  const text = state === "passed" ? "rgba(255,255,255,.45)" : "#fff";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        background:${bg};
        border:1.5px solid ${border};
        color:${text};font-family:var(--font-mono);
        font-size:${state === "next" ? 12 : 10}px;font-weight:500;
        box-shadow:0 1px 4px rgba(0,0,0,.5);
        ${state === "next" ? "animation: wp-pulse 1.6s ease-in-out infinite;" : ""}
      ">${state === "passed" ? "✓" : seq}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
  tracks,
  routes,
  selectedId,
  onSelect,
  followTarget,
  compact = false,
}: {
  drones: LiveDrone[];
  zones: FlightZone[];
  tracks: TrackLine[];
  routes: PlannedRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  followTarget: [number, number] | null;
  compact?: boolean;
}) {
  const [layer, setLayer] = useState<LayerKey>("satellite");

  const points: [number, number][] = drones.map((d) => [d.latitude, d.longitude]);
  const center: [number, number] = points[0] ?? [42.66, 21.16];
  const active = LAYERS[layer];

  return (
    <>
      <style>{`
        @keyframes wp-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        @keyframes route-flow {
          to { stroke-dashoffset: -24; }
        }
        @keyframes arrow-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        .route-planned {
          animation: route-flow 1.4s linear infinite;
        }
      `}</style>

      {!compact && (
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
      )}

      <MapContainer
        center={center}
        zoom={compact ? 16 : 15}
        scrollWheelZoom={!compact}
        zoomControl={!compact}
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

        {/* Zonat */}
        {zones.map((z) => {
          const pts = zonePoints(z.polygonGeoJson);
          if (pts.length === 0) return null;
          return (
            <Polygon
              key={z.id}
              positions={pts}
              pathOptions={{
                color: z.isRestricted ? "#ff4fb0" : "#4fdb9a",
                weight: 1.5,
                opacity: 0.6,
                fillOpacity: 0.06,
                dashArray: z.isRestricted ? "8 5" : undefined,
              }}
            />
          );
        })}

        {/* Rruga e planifikuar — e ndare ne pjesen e kaluar dhe te mbetur */}
        {routes.map((r) => {
          const color = droneColor(r.droneId);
          const isSelected = selectedId === r.droneId;
          const raw = r.waypoints.map((w) => [w.lat, w.lng] as [number, number]);

          const { passed, remaining } = splitAtWaypoint(raw, r.nextIndex);

          return (
            <div key={`route-${r.droneId}`}>
              {/* Pjesa e kaluar — e zbehte, pa animacion */}
              {passed.length > 1 && (
                <Polyline
                  positions={passed}
                  pathOptions={{
                    color,
                    weight: 1,
                    opacity: isSelected ? 0.22 : 0.12,
                    dashArray: "3 6",
                  }}
                />
              )}

              {/* Pjesa e mbetur — e ndritshme, me vije qe rrjedh dhe shigjeta */}
              {remaining.length > 1 && (
                <>
                  <Polyline
                    positions={remaining}
                    className="route-planned"
                    pathOptions={{
                      color,
                      weight: 2,
                      opacity: isSelected ? 0.75 : 0.45,
                      dashArray: "8 16",
                    }}
                  />

                  <RouteArrows
                    path={remaining}
                    color={color}
                    spacing={45}
                    opacity={isSelected ? 1 : 0.55}
                  />
                </>
              )}

              {/* Waypoints me gjendje te ndryshme */}
              {r.waypoints.map((w, i) => {
                const state =
                  i < r.nextIndex ? "passed" : i === r.nextIndex ? "next" : "upcoming";

                return (
                  <Marker
                    key={`wp-${r.droneId}-${w.seq}`}
                    position={[w.lat, w.lng]}
                    icon={waypointIcon(w.seq, color, state)}
                    interactive={false}
                    opacity={
                      isSelected || state === "next"
                        ? 1
                        : state === "passed"
                          ? 0.4
                          : 0.6
                    }
                  />
                );
              })}
            </div>
          );
        })}

        {/* Trajektorja e fluturuar — e lakuar, me zbehje graduale */}
        {tracks.map((t) => {
          if (t.points.length < 2) return null;

          const color = droneColor(t.droneId);
          const isSelected = selectedId === t.droneId;
          const curved = smoothPath(t.points, 8);
          const segments = fadeSegments(curved);

          return (
            <div key={`track-${t.droneId}`}>
              {/* Shkelqim i gjere poshte */}
              <Polyline
                positions={curved}
                pathOptions={{
                  color,
                  weight: isSelected ? 9 : 7,
                  opacity: 0.12,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />

              {/* Segmentet me opacitet ne rritje */}
              {segments.map((seg, i) => (
                <Polyline
                  key={i}
                  positions={seg.points}
                  pathOptions={{
                    color,
                    weight: isSelected ? 3.5 : 2.5,
                    opacity: seg.opacity * (isSelected ? 1 : 0.75),
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              ))}
            </div>
          );
        })}

        {/* Vija nga droni drejt pikes tjeter */}
        {drones.map((d) => {
          const route = routes.find((r) => r.droneId === d.droneId);
          if (!route) return null;
          const next = route.waypoints[route.nextIndex];
          if (!next) return null;

          const color = droneColor(d.droneId);
          return (
            <Polyline
              key={`heading-${d.droneId}`}
              positions={[
                [d.latitude, d.longitude],
                [next.lat, next.lng],
              ]}
              pathOptions={{
                color,
                weight: 1.5,
                opacity: selectedId === d.droneId ? 0.7 : 0.35,
                dashArray: "2 6",
              }}
            />
          );
        })}

        {/* Vektori i shpejtesise — ku do te jete pas 10 sekondash */}
        {drones
          .filter((d) => d.groundSpeedMs > 1)
          .map((d) => {
            const ahead = project(
              { lat: d.latitude, lng: d.longitude },
              d.groundSpeedMs * 10,
              d.headingDegrees
            );
            return (
              <CircleMarker
                key={`vec-${d.droneId}`}
                center={[ahead.lat, ahead.lng]}
                radius={3}
                pathOptions={{
                  color: droneColor(d.droneId),
                  fillColor: droneColor(d.droneId),
                  fillOpacity: 0.6,
                  weight: 1,
                }}
              />
            );
          })}

        {/* Dronët */}
        {drones.map((d) => {
          const color = droneColor(d.droneId);
          return (
            <Marker
              key={d.droneId}
              position={[d.latitude, d.longitude]}
              icon={droneIcon(
                d.headingDegrees,
                color,
                d.warnings.length > 0,
                selectedId === d.droneId
              )}
              eventHandlers={{ click: () => onSelect(d.droneId) }}
              zIndexOffset={selectedId === d.droneId ? 1000 : 500}
            >
              <Tooltip direction="top" offset={[0, -24]}>
                <span className="font-mono text-[11px]">
                  {d.serialNumber}
                  {d.nickname && ` · ${d.nickname}`}
                  <br />
                  {d.altitudeMeters.toFixed(0)} m · {d.groundSpeedMs.toFixed(1)} m/s ·{" "}
                  {d.batteryPercentage.toFixed(0)}%
                </span>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}