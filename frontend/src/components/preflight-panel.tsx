"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Checklist } from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Check, X } from "lucide-react";

const items = [
  { key: "batteryChecked", label: "Bateria e kontrolluar dhe e karikuar" },
  { key: "propellersChecked", label: "Helikat në gjendje të mirë" },
  { key: "gpsSignalOk", label: "Sinjali GPS i qëndrueshëm" },
  { key: "weatherConditionsOk", label: "Kushtet e motit të përshtatshme" },
  { key: "firmwareUpToDate", label: "Firmware i përditësuar" },
] as const;

type ItemKey = (typeof items)[number]["key"];

export function PreflightPanel({
  missionId,
  editable,
}: {
  missionId: string;
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const [checks, setChecks] = useState<Record<ItemKey, boolean>>({
    batteryChecked: false,
    propellersChecked: false,
    gpsSignalOk: false,
    weatherConditionsOk: false,
    firmwareUpToDate: false,
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: checklist, isLoading } = useQuery({
    queryKey: ["checklist", missionId],
    queryFn: async () => {
      try {
        return (await api.get<Checklist>(`/missions/${missionId}/checklist`)).data;
      } catch {
        return null; // 404 = ende s'ka checklist
      }
    },
  });

  const submit = useMutation({
    mutationFn: async () =>
      api.post(`/missions/${missionId}/checklist`, { ...checks, notes: notes || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", missionId] });
      setError(null);
    },
    onError: (err) => setError(getApiError(err, "Checklist-i nuk u ruajt.")),
  });

  if (isLoading) {
    return <p className="text-[13px] text-muted-foreground">Duke ngarkuar...</p>;
  }

  // Tashme i dorëzuar — vetëm lexim
  if (checklist) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {items.map((item) => {
            const passed = checklist[item.key];
            return (
              <div key={item.key} className="flex items-center gap-3">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    passed
                      ? "bg-[var(--status-clear)]/15 text-[var(--status-clear)]"
                      : "bg-[var(--status-warning)]/15 text-[var(--status-warning)]"
                  }`}
                >
                  {passed ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : (
                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                  )}
                </span>
                <span
                  className={`text-[13px] ${
                    passed ? "" : "text-[var(--status-warning)]"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {checklist.notes && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-[12px] text-muted-foreground">
            {checklist.notes}
          </p>
        )}

        <p className="font-mono text-[11px] text-muted-foreground">
          {checklist.completedByName ?? "Pilot"} ·{" "}
          {checklist.completedAt.slice(0, 16).replace("T", " ")}Z
        </p>

        {!checklist.allChecksPassed && (
          <p className="text-[12px] text-[var(--status-warning)]">
            Jo të gjitha kontrollet kaluan — misioni s&apos;mund të niset.
          </p>
        )}
      </div>
    );
  }

  // Misioni ka nisur tashmë dhe s'ka checklist (të dhëna të vjetra)
  if (!editable) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Nuk u dorëzua asnjë checklist për këtë mision.
      </p>
    );
  }

  const allChecked = items.every((i) => checks[i.key]);

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-3 text-[13px]"
          >
            <input
              type="checkbox"
              checked={checks[item.key]}
              onChange={(e) =>
                setChecks((prev) => ({ ...prev, [item.key]: e.target.checked }))
              }
              className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
            />
            {item.label}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Shënime (opsionale)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Vërejtje para fluturimit"
        />
      </div>

      {error && (
        <p className="text-[12px] text-[var(--status-warning)]">{error}</p>
      )}

      {!allChecked && (
        <p className="text-[12px] text-muted-foreground">
          Të gjitha kontrollet duhet të kalojnë që misioni të niset.
        </p>
      )}

      <Button size="sm" onClick={() => submit.mutate()} disabled={submit.isPending}>
        {submit.isPending ? "Duke ruajtur..." : "Dorëzo checklist-in"}
      </Button>
    </div>
  );
}