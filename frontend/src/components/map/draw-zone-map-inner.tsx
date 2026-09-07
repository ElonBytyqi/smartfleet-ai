"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type Vertex = { lat: number; lng: number };

const LAYERS = {
  satellite: {
    label: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar",
  },
  streets: {
    label: "Rrugë",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap",
  },
} as const;

type LayerKey = keyof typeof LAYERS;

function vertexIcon(index: number, isFirst: boolean, color: string) {
  const size = isFirst ? 22 : 18;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        background:${isFirst ? color : "rgba(0,0,0,.6)"};
        border:2px solid ${isFirst ? "#fff" : color};
        color:#fff;font-family:var(--font-mono);font-size:10px;font-weight:500;
        box-shadow:0 1px 4px rgba(0,0,0,.5);
        cursor:move;
      ">${index + 1}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function ClickHandler({ onAdd }: { onAdd: (v: Vertex) => void }) {
  useMapEvents({
    click(e) {
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FitToVertices({ vertices }: { vertices: Vertex[] }) {
  const map = useMap();
  const count = vertices.length;

  useEffect(() => {
    // Vetem kur ngarkohet nje poligon ekzistues
    if (count < 3) return;
    map.fitBounds(
      L.latLngBounds(vertices.map((v) => [v.lat, v.lng] as [number, number])),
      { padding: [50, 50] }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count > 0]);

  return null;
}

export default function DrawZoneMapInner({
  vertices,
  onAdd,
  onMove,
  color = "#4fdb9a",
  center = [42.66, 21.16] as [number, number],
}: {
  vertices: Vertex[];
  onAdd: (v: Vertex) => void;
  onMove: (index: number, v: Vertex) => void;
  color?: string;
  center?: [number, number];
}) {
  const [layer, setLayer] = useState<LayerKey>("satellite");
  const positions = vertices.map((v) => [v.lat, v.lng] as [number, number]);
  const active = LAYERS[layer];

  return (
    <>
      <div className="absolute right-3 top-3 z-[1000] flex gap-0.5 rounded-md border border-border bg-card/95 p-0.5 shadow-sm backdrop-blur">
        {(Object.keys(LAYERS) as LayerKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setLayer(k)}
            className={`cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
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
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer key={layer} attribution={active.attribution} url={active.url} maxZoom={19} />

        <ClickHandler onAdd={onAdd} />
        <FitToVertices vertices={vertices} />

        {/* Poligoni — vetem me 3+ kulme */}
        {positions.length >= 3 && (
          <Polygon
            positions={positions}
            pathOptions={{ color, weight: 2, fillOpacity: 0.15 }}
          />
        )}

        {/* Me 2 kulme, vetem vije */}
        {positions.length === 2 && (
          <Polyline positions={positions} pathOptions={{ color, weight: 2 }} />
        )}

        {/* Kulmet — te terhiqshme */}
        {vertices.map((v, i) => (
          <Marker
            key={i}
            position={[v.lat, v.lng]}
            icon={vertexIcon(i, i === 0, color)}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onMove(i, { lat, lng });
              },
            }}
          />
        ))}
      </MapContainer>
    </>
  );
}