"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Waypoint } from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

type Row = { lat: string; lng: string; alt: string; action: string };

export function WaypointEditor({
  missionId,
  waypoints,
  editable,
}: {
  missionId: string;
  waypoints: Waypoint[] | undefined;
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Vlerat fillestare nga props — pa useEffect
  const [rows, setRows] = useState<Row[]>(() =>
    (waypoints ?? []).map((w) => ({
      lat: String(w.latitude),
      lng: String(w.longitude),
      alt: w.altitudeMeters !== null ? String(w.altitudeMeters) : "",
      action: w.actionType ?? "Waypoint",
    }))
  );

  const save = useMutation({
    mutationFn: async () =>
      api.put(
        `/missions/${missionId}/waypoints`,
        rows.map((r, i) => ({
          sequenceNumber: i + 1,
          latitude: Number(r.lat),
          longitude: Number(r.lng),
          altitudeMeters: r.alt ? Number(r.alt) : null,
          actionType: r.action || null,
        }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waypoints", missionId] });
      queryClient.invalidateQueries({ queryKey: ["mission", missionId] });
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Ruajtja dështoi.")),
  });

  function update(i: number, field: keyof Row, value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    );
  }

  if (!editable) {
    return (
      <div className="space-y-2">
        {(!waypoints || waypoints.length === 0) && (
          <p className="text-[13px] text-muted-foreground">
            Asnjë pikë e regjistruar.
          </p>
        )}
        {waypoints?.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-3 border-b py-2 font-mono text-[12px] last:border-0"
          >
            <span className="w-6 text-muted-foreground">{w.sequenceNumber}</span>
            <span className="tabular-nums">{w.latitude.toFixed(5)}</span>
            <span className="tabular-nums">{w.longitude.toFixed(5)}</span>
            <span className="tabular-nums text-muted-foreground">
              {w.altitudeMeters ?? "—"} m
            </span>
            <span className="ml-auto text-muted-foreground">{w.actionType}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="w-6" />
        <span className="flex-1">Gjerësia</span>
        <span className="flex-1">Gjatësia</span>
        <span className="w-20">Lartësia</span>
        <span className="w-8" />
      </div>

      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 font-mono text-[12px] text-muted-foreground">
            {i + 1}
          </span>
          <Input
            className="h-8 flex-1 font-mono text-[12px]"
            placeholder="42.5200"
            value={r.lat}
            onChange={(e) => update(i, "lat", e.target.value)}
          />
          <Input
            className="h-8 flex-1 font-mono text-[12px]"
            placeholder="21.1200"
            value={r.lng}
            onChange={(e) => update(i, "lng", e.target.value)}
          />
          <Input
            className="h-8 w-20 font-mono text-[12px]"
            placeholder="100"
            value={r.alt}
            onChange={(e) => update(i, "alt", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-[var(--status-warning)]"
            aria-label="Hiq pikën"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      ))}

      {error && (
        <p className="text-[12px] text-[var(--status-warning)]">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { lat: "", lng: "", alt: "100", action: "Waypoint" },
            ])
          }
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Shto pikë
        </Button>
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={rows.length < 2 || save.isPending}
        >
          {save.isPending ? "Duke ruajtur..." : "Ruaj rrugën"}
        </Button>
      </div>

      {rows.length === 1 && (
        <p className="text-[12px] text-muted-foreground">
          Nevojiten të paktën dy pika.
        </p>
      )}
    </div>
  );
}