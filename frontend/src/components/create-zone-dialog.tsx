"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { qk } from "@/lib/queries";
import { MISSION_TYPES, TYPE_LABELS } from "@/lib/constants";
import { polygonArea, formatArea } from "@/lib/geo";
import { DrawZoneMap, type Vertex } from "@/components/map/draw-zone-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Undo2, Trash2, ShieldAlert, MousePointerClick } from "lucide-react";

const RESTRICTED_COLOR = "#ff4fb0";
const OPEN_COLOR = "#4fdb9a";

export function CreateZoneDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [zoneType, setZoneType] = useState<string>(MISSION_TYPES[0]);
  const [isRestricted, setIsRestricted] = useState(false);
  const [maxAltitude, setMaxAltitude] = useState("120");
  const [vertices, setVertices] = useState<Vertex[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      // GeoJSON: [lng, lat], me piken e pare te perseritur ne fund
      const ring = [...vertices, vertices[0]].map((v) => [
        Number(v.lng.toFixed(6)),
        Number(v.lat.toFixed(6)),
      ]);

      return api.post("/flight-zones", {
        name,
        zoneType,
        polygonGeoJson: JSON.stringify({ type: "Polygon", coordinates: [ring] }),
        isRestricted,
        maxAltitudeMeters: maxAltitude ? Number(maxAltitude) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.flightZones });
      resetForm();
      setOpen(false);
    },
    onError: (err) => setError(getApiError(err, "Zona nuk u krijua.")),
  });

  function resetForm() {
    setName("");
    setZoneType(MISSION_TYPES[0]);
    setIsRestricted(false);
    setMaxAltitude("120");
    setVertices([]);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  const area = polygonArea(vertices.map((v) => ({ lat: v.lat, lng: v.lng })));
  const color = isRestricted ? RESTRICTED_COLOR : OPEN_COLOR;

  const canSave =
    name.trim().length >= 3 && vertices.length >= 3 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Zonë e re
        </Button>
      </DialogTrigger>

      <DialogContent className="!max-w-[900px] sm:!max-w-[900px]">
                <DialogHeader>
          <DialogTitle className="font-heading">Vizato zonë fluturimi</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          {/* Harta */}
          <div className="relative h-[420px] min-h-[300px] w-full overflow-hidden rounded-lg border">
            <DrawZoneMap
              vertices={vertices}
              onAdd={(v) => setVertices((prev) => [...prev, v])}
              onMove={(i, v) =>
                setVertices((prev) => prev.map((old, idx) => (idx === i ? v : old)))
              }
              color={color}
            />

            {vertices.length === 0 && (
              <div className="pointer-events-none absolute inset-0 z-[999] flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-md bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur">
                  <MousePointerClick className="h-4 w-4 text-primary" strokeWidth={2} />
                  <p className="text-[13px]">Kliko në hartë për të vizatuar zonën</p>
                </div>
              </div>
            )}
          </div>

          {/* Forma */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone-name">Emri</Label>
              <Input
                id="zone-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ferma Lipjan - Parcela C"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipi</Label>
              <Select value={zoneType} onValueChange={setZoneType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
<SelectContent className="z-[9999]">                  {MISSION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alt">Lartësia maksimale (m)</Label>
              <Input
                id="alt"
                type="number"
                min="0"
                max="500"
                value={maxAltitude}
                onChange={(e) => setMaxAltitude(e.target.value)}
              />
            </div>

            {/* Kufizimi */}
            <button
              type="button"
              onClick={() => setIsRestricted((r) => !r)}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                isRestricted
                  ? "border-primary/40 bg-primary/10"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <ShieldAlert
                className={`h-4 w-4 shrink-0 ${
                  isRestricted ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={2}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium">Zonë e kufizuar</p>
                <p className="text-[11px] text-muted-foreground">
                  Kërkon pilot mbikëqyrës
                </p>
              </div>
            </button>

            {/* Statistikat e vizatimit */}
            <div className="rounded-md border bg-muted/30 px-3 py-2.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Kulme</span>
                <span className="font-mono tabular-nums">{vertices.length}</span>
              </div>
              <div className="mt-1 flex justify-between text-[12px]">
                <span className="text-muted-foreground">Sipërfaqja</span>
                <span className="font-mono tabular-nums">
                  {vertices.length >= 3 ? formatArea(area) : "—"}
                </span>
              </div>
            </div>

            {/* Veprimet e vizatimit */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={vertices.length === 0}
                onClick={() => setVertices((prev) => prev.slice(0, -1))}
              >
                <Undo2 className="h-3.5 w-3.5" strokeWidth={2} />
                Zhbëj
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={vertices.length === 0}
                onClick={() => setVertices([])}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                Pastro
              </Button>
            </div>

            {vertices.length > 0 && vertices.length < 3 && (
              <p className="text-[12px] text-muted-foreground">
                Nevojiten të paktën 3 kulme për një zonë.
              </p>
            )}

            {error && (
              <p className="text-[13px] text-[var(--status-warning)]">{error}</p>
            )}

            <div className="mt-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
              >
                Anulo
              </Button>
              <Button
                className="flex-1"
                disabled={!canSave}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? "Duke ruajtur..." : "Krijo zonën"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}