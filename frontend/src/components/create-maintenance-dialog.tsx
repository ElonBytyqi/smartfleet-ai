"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone } from "@/lib/types";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const types = [
  { value: "0", label: "E planifikuar" },
  { value: "1", label: "Riparim" },
  { value: "2", label: "Parandaluese" },
];

const schema = z.object({
  droneId: z.string().uuid("Zgjidh një dron."),
  maintenanceType: z.string(),
  description: z.string().min(5, "Përshkruaj punën me të paktën 5 karaktere."),
  cost: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  droneId: "",
  maintenanceType: "0",
  description: "",
  cost: "",
};

export function CreateMaintenanceDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const { data: drones } = useQuery({
    queryKey: ["drones"],
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
  });

  const mutation = useMutation({
    mutationFn: async (v: FormValues) =>
      api.post("/maintenance", {
        droneId: v.droneId,
        maintenanceType: Number(v.maintenanceType),
        description: v.description,
        cost: v.cost ? Number(v.cost) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["drones"] });
      reset(defaults);
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => setServerError(getApiError(err, "Regjistrimi nuk u krijua.")),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(defaults);
      setServerError(null);
    }
  }

  const droneId = watch("droneId");
  const maintenanceType = watch("maintenanceType");

  // Droneët ne mision nuk mund te futen ne servis
  const selectable = drones?.filter((d) => d.status !== "InMission") ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Punë e re
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Regjistro mirëmbajtje</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>Droni</Label>
            <Select
              value={droneId}
              onValueChange={(v) => setValue("droneId", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.droneId}>
                <SelectValue placeholder="Zgjidh dronin" />
              </SelectTrigger>
              <SelectContent>
                {selectable.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.serialNumber} · {d.nickname ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.droneId && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.droneId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Lloji</Label>
            <Select
              value={maintenanceType}
              onValueChange={(v) => setValue("maintenanceType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Përshkrimi</Label>
            <Input
              id="desc"
              placeholder="Zëvendësim i helikave të përparme"
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Kosto e parashikuar (opsionale)</Label>
            <Input id="cost" type="number" step="0.01" min="0" {...register("cost")} />
          </div>

          {serverError && (
            <p className="text-[13px] text-[var(--status-warning)]">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Anulo
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Duke ruajtur..." : "Regjistro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}