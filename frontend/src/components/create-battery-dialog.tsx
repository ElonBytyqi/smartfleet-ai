"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { qk, useDrones } from "@/lib/queries";
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
  serialNumber: z.string().min(3, "Numri serik duhet të ketë të paktën 3 karaktere."),
  capacityMah: z
    .string()
    .min(1, "Kapaciteti është i detyrueshëm.")
    .refine((v) => Number(v) > 0, "Kapaciteti duhet të jetë pozitiv."),
  droneId: z.string().optional(),
  purchaseDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  serialNumber: "",
  capacityMah: "",
  droneId: "none",
  purchaseDate: "",
};

export function CreateBatteryDialog() {
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

  const { data: drones } = useDrones();

  const mutation = useMutation({
    mutationFn: async (v: FormValues) =>
      api.post("/batteries", {
        serialNumber: v.serialNumber,
        capacityMah: Number(v.capacityMah),
        droneId: v.droneId === "none" ? null : v.droneId,
        purchaseDate: v.purchaseDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.batteries });
      queryClient.invalidateQueries({ queryKey: qk.drones });
      reset(defaults);
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => setServerError(getApiError(err, "Bateria nuk u regjistrua.")),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(defaults);
      setServerError(null);
    }
  }

  const droneId = watch("droneId");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Bateri e re
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Regjistro bateri</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serial">Numri serik</Label>
            <Input
              id="serial"
              placeholder="BAT-2050"
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
            <Label htmlFor="capacity">Kapaciteti (mAh)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              placeholder="5880"
              aria-invalid={!!errors.capacityMah}
              {...register("capacityMah")}
            />
            {errors.capacityMah && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.capacityMah.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Caktoje te droni (opsionale)</Label>
            <Select value={droneId} onValueChange={(v) => setValue("droneId", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pa dron</SelectItem>
                {drones?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.serialNumber} · {d.nickname ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase">Data e blerjes (opsionale)</Label>
            <Input id="purchase" type="date" max={today} {...register("purchaseDate")} />
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