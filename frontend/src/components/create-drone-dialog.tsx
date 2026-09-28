"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { useDroneModels } from "@/lib/queries";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const schema = z.object({
  serialNumber: z
    .string()
    .min(3, "Numri serik duhet të ketë të paktën 3 karaktere.")
    .max(100, "Numri serik është shumë i gjatë."),
  nickname: z.string().optional(),
  droneModelId: z.string().uuid("Zgjidh një model."),
  purchaseDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  serialNumber: "",
  nickname: "",
  droneModelId: "",
  purchaseDate: "",
};

export function CreateDroneDialog() {
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

  // Droni ka nevoje per modelet, jo per dronet e tjere
const { data: models } = useDroneModels();

  const mutation = useMutation({
    mutationFn: async (v: FormValues) =>
      api.post("/drones", {
        serialNumber: v.serialNumber,
        nickname: v.nickname || null,
        droneModelId: v.droneModelId,
        purchaseDate: v.purchaseDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.drones });
      queryClient.invalidateQueries({ queryKey: qk.droneModels });
      reset(defaults);
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => setServerError(getApiError(err, "Droni nuk u regjistrua.")),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(defaults);
      setServerError(null);
    }
  }

  const droneModelId = watch("droneModelId");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Dron i ri
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Regjistro dron</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serial">Numri serik</Label>
            <Input
              id="serial"
              placeholder="DJI-2026-1021"
              className="font-mono"
              aria-invalid={!!errors.serialNumber}
              {...register("serialNumber")}
            />
            {errors.serialNumber && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.serialNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nofka (opsionale)</Label>
            <Input id="nickname" placeholder="Falcon" {...register("nickname")} />
          </div>

          <div className="space-y-2">
            <Label>Modeli</Label>
            <Select
              value={droneModelId}
              onValueChange={(v) =>
                setValue("droneModelId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger aria-invalid={!!errors.droneModelId}>
                <SelectValue placeholder="Zgjidh modelin" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {models?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.manufacturerName} {m.modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.droneModelId && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.droneModelId.message}
              </p>
            )}
            {models?.length === 0 && (
              <p className="text-[12px] text-[var(--status-caution)]">
                Ende s&apos;ka modele. Krijo një model fillimisht.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase">Data e blerjes (opsionale)</Label>
            <Input
              id="purchase"
              type="date"
              max={today}
              {...register("purchaseDate")}
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
              {mutation.isPending ? "Duke regjistruar..." : "Regjistro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}