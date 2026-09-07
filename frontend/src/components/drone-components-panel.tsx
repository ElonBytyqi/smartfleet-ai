"use client";

import { useState } from "react";
import {
  useDroneComponents,
  useAddComponent,
  useUpdateComponent,
} from "@/lib/queries/components";
import {
  COMPONENT_TYPES,
  COMPONENT_LABELS,
  COMPONENT_STATUSES,
  COMPONENT_STATUS_LABELS,
} from "@/lib/constants";
import { getApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Cpu, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";

const STATUS_STYLE: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  OK: { color: "var(--status-clear)", icon: CheckCircle2 },
  NeedsInspection: { color: "var(--status-caution)", icon: AlertCircle },
  Replaced: { color: "var(--muted-foreground)", icon: RefreshCw },
};

/** Sa e konsumuar është pjesa, sipas orëve të fluturimit të dronit */
function wearPercent(droneHours: number, lifespan: number | null): number | null {
  if (!lifespan || lifespan <= 0) return null;
  return Math.min(100, (droneHours / lifespan) * 100);
}

export function DroneComponentsPanel({
  droneId,
  droneHours,
}: {
  droneId: string;
  droneHours: number;
}) {
  const { data, isLoading } = useDroneComponents(droneId);
  const add = useAddComponent(droneId);
  const update = useUpdateComponent(droneId);

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<string>(COMPONENT_TYPES[0]);
  const [serial, setSerial] = useState("");
  const [lifespan, setLifespan] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const components = data ?? [];
  const needsAttention = components.filter(
    (c) => c.status === "NeedsInspection"
  ).length;

  // Grupo sipas tipit — dronet kane 4 motorë, 4 helika etj.
  const grouped = components.reduce<Record<string, typeof components>>(
    (acc, c) => {
      (acc[c.componentType] ??= []).push(c);
      return acc;
    },
    {}
  );

  function submitNew() {
    setError(null);
    add.mutate(
      {
        componentType: type,
        serialNumber: serial || null,
        installedAt: today,
        expectedLifespanHours: lifespan ? Number(lifespan) : null,
      },
      {
        onSuccess: () => {
          setSerial("");
          setLifespan("");
          setAdding(false);
        },
        onError: (e) => setError(getApiError(e, "Komponenti nuk u shtua.")),
      }
    );
  }

  if (isLoading) {
    return <p className="text-[13px] text-muted-foreground">Duke ngarkuar...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            {components.length} komponentë
          </span>
          {needsAttention > 0 && (
            <span className="text-[12px] text-[var(--status-caution)]">
              {needsAttention} për inspektim
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-[12px]"
          onClick={() => setAdding((a) => !a)}
        >
          {adding ? (
            <>
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Anulo
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Shto
            </>
          )}
        </Button>
      </div>

      {/* Forma e shtimit */}
      {adding && (
        <div className="space-y-3 rounded-md border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Tipi</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {COMPONENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {COMPONENT_LABELS[t] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Numri serik</Label>
              <Input
                className="h-8 font-mono text-[12px]"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="MTR-12345"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Jetëgjatësia e pritur (orë)</Label>
            <Input
              className="h-8 text-[12px]"
              type="number"
              min="1"
              value={lifespan}
              onChange={(e) => setLifespan(e.target.value)}
              placeholder="800"
            />
          </div>

          {error && (
            <p className="text-[12px] text-[var(--status-warning)]">{error}</p>
          )}

          <Button
            size="sm"
            className="h-7 w-full text-[12px]"
            disabled={add.isPending}
            onClick={submitNew}
          >
            {add.isPending ? "Duke shtuar..." : "Shto komponentin"}
          </Button>
        </div>
      )}

      {components.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Cpu className="h-7 w-7 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">
            Asnjë komponent i regjistruar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([groupType, items]) => (
            <div key={groupType}>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {COMPONENT_LABELS[groupType] ?? groupType}
                {items.length > 1 && ` · ${items.length}`}
              </p>

              <div className="space-y-1.5">
                {items.map((c) => {
                  const style = STATUS_STYLE[c.status] ?? STATUS_STYLE.OK;
                  const Icon = style.icon;
                  const wear = wearPercent(droneHours, c.expectedLifespanHours);

                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-2.5"
                    >
                      <Icon
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: style.color }}
                        strokeWidth={2}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[12px]">
                          {c.serialNumber ?? "pa numër serik"}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          instaluar {c.installedAt}
                          {c.expectedLifespanHours &&
                            ` · ${c.expectedLifespanHours}h jetëgjatësi`}
                        </p>
                      </div>

                      {/* Konsumi */}
                      {wear !== null && (
                        <div className="hidden w-24 shrink-0 sm:block">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${wear}%`,
                                background:
                                  wear >= 90
                                    ? "var(--status-warning)"
                                    : wear >= 70
                                      ? "var(--status-caution)"
                                      : "var(--status-clear)",
                              }}
                            />
                          </div>
                          <p className="mt-0.5 text-right font-mono text-[10px] text-muted-foreground">
                            {wear.toFixed(0)}%
                          </p>
                        </div>
                      )}

                      {/* Ndryshimi i statusit */}
                      <Select
                        value={c.status}
                        onValueChange={(v) =>
                          update.mutate(
                            {
                              componentId: c.id,
                              componentType: c.componentType,
                              serialNumber: c.serialNumber,
                              expectedLifespanHours: c.expectedLifespanHours,
                              status: v,
                            },
                            {
                              onError: (e) =>
                                setError(getApiError(e, "Statusi nuk u ndryshua.")),
                            }
                          )
                        }
                      >
                        <SelectTrigger className="h-7 w-36 shrink-0 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          {COMPONENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {COMPONENT_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}