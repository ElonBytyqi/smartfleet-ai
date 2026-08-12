"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MaintenanceRecord } from "@/lib/types";
import { getApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CompleteMaintenanceDialog({
  record,
  onClose,
}: {
  record: MaintenanceRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [cost, setCost] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [returnToService, setReturnToService] = useState("yes");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/maintenance/${record!.id}/complete`, {
        cost: cost ? Number(cost) : null,
        nextRecommendedDate: nextDate || null,
        returnDroneToService: returnToService === "yes",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["drones"] });
      setCost("");
      setNextDate("");
      setError(null);
      onClose();
    },
    onError: (err) => setError(getApiError(err, "Mbyllja dështoi.")),
  });

  return (
    <Dialog open={record !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Mbyll punën</DialogTitle>
        </DialogHeader>

        {record && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 px-4 py-3">
              <p className="text-[13px] font-medium">{record.description}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {record.droneSerialNumber} · {record.droneNickname}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Kosto përfundimtare</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder={record.cost?.toString() ?? "0.00"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next">Inspektimi i ardhshëm</Label>
              <Input
                id="next"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Gjendja e dronit pas punës</Label>
              <Select value={returnToService} onValueChange={setReturnToService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Kthehu në shërbim</SelectItem>
                  <SelectItem value="no">Mbaje të ndaluar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-[13px] text-[var(--status-warning)]">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anulo
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Duke mbyllur..." : "Mbyll punën"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}