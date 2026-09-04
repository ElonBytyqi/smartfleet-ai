"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { qk } from "@/lib/queries";
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
import { Plus } from "lucide-react";

const num = (msg: string) =>
  z.string().min(1, msg).refine((v) => Number(v) > 0, "Duhet të jetë pozitiv.");

const schema = z.object({
  manufacturerName: z.string().min(2, "Prodhuesi është i detyrueshëm."),
  modelName: z.string().min(2, "Emri i modelit është i detyrueshëm."),
  maxFlightTimeMinutes: num("Koha maksimale e fluturimit."),
  maxPayloadKg: num("Ngarkesa maksimale."),
  maxSpeedKmh: num("Shpejtësia maksimale."),
  cameraSpecs: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  manufacturerName: "",
  modelName: "",
  maxFlightTimeMinutes: "",
  maxPayloadKg: "",
  maxSpeedKmh: "",
  cameraSpecs: "",
};

export function CreateDroneModelDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const mutation = useMutation({
    mutationFn: async (v: FormValues) =>
      api.post("/drone-models", {
        manufacturerName: v.manufacturerName,
        modelName: v.modelName,
        maxFlightTimeMinutes: Number(v.maxFlightTimeMinutes),
        maxPayloadKg: Number(v.maxPayloadKg),
        maxSpeedKmh: Number(v.maxSpeedKmh),
        cameraSpecs: v.cameraSpecs || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.droneModels });
      reset(defaults);
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => setServerError(getApiError(err, "Modeli nuk u krijua.")),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(defaults);
      setServerError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Model i ri
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Shto model droni</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Prodhuesi</Label>
              <Input
                id="manufacturer"
                placeholder="DJI"
                aria-invalid={!!errors.manufacturerName}
                {...register("manufacturerName")}
              />
              {errors.manufacturerName && (
                <p className="text-[12px] text-[var(--status-warning)]">
                  {errors.manufacturerName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modeli</Label>
              <Input
                id="model"
                placeholder="Matrice 400"
                aria-invalid={!!errors.modelName}
                {...register("modelName")}
              />
              {errors.modelName && (
                <p className="text-[12px] text-[var(--status-warning)]">
                  {errors.modelName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="time">Fluturimi (min)</Label>
              <Input
                id="time"
                type="number"
                min="1"
                placeholder="55"
                aria-invalid={!!errors.maxFlightTimeMinutes}
                {...register("maxFlightTimeMinutes")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payload">Ngarkesa (kg)</Label>
              <Input
                id="payload"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="2.7"
                aria-invalid={!!errors.maxPayloadKg}
                {...register("maxPayloadKg")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Shpejtësia</Label>
              <Input
                id="speed"
                type="number"
                min="1"
                placeholder="82"
                aria-invalid={!!errors.maxSpeedKmh}
                {...register("maxSpeedKmh")}
              />
            </div>
          </div>

          {(errors.maxFlightTimeMinutes ||
            errors.maxPayloadKg ||
            errors.maxSpeedKmh) && (
            <p className="text-[12px] text-[var(--status-warning)]">
              Të tri specifikat janë të detyrueshme dhe pozitive.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="camera">Kamera (opsionale)</Label>
            <Input
              id="camera"
              placeholder="Zenmuse H30 compatible"
              {...register("cameraSpecs")}
            />
          </div>

          {serverError && (
            <p className="text-[13px] text-[var(--status-warning)]">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Anulo
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Duke krijuar..." : "Krijo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}