"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FlightZone } from "@/lib/types";
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

const missionTypes = [
  "Agriculture",
  "Infrastructure",
  "Energy",
  "Environmental",
  "Mapping",
] as const;

// Rregullat e formes — nje vend i vetem, ripërdorshem
const schema = z
  .object({
    title: z
      .string()
      .min(3, "Titulli duhet të ketë të paktën 3 karaktere.")
      .max(200, "Titulli është shumë i gjatë."),
    missionType: z.enum(missionTypes),
    flightZoneId: z.string().uuid("Zgjidh një zonë fluturimi."),
    scheduledStart: z.string().min(1, "Cakto orën e fillimit."),
    scheduledEnd: z.string().optional(),
    isAutonomous: z.boolean(),
  })
  .refine(
    (d) => !d.scheduledEnd || new Date(d.scheduledEnd) > new Date(d.scheduledStart),
    { message: "Mbarimi duhet pas fillimit.", path: ["scheduledEnd"] }
  );

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  title: "",
  missionType: "Agriculture",
  flightZoneId: "",
  scheduledStart: "",
  scheduledEnd: "",
  isAutonomous: true,
};

export function CreateMissionDialog() {
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

  const { data: zones } = useQuery({
    queryKey: ["flight-zones"],
    queryFn: async () => (await api.get<FlightZone[]>("/flight-zones")).data,
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) =>
      api.post("/missions", {
        title: values.title,
        missionType: values.missionType,
        flightZoneId: values.flightZoneId,
        scheduledStart: new Date(values.scheduledStart).toISOString(),
        scheduledEnd: values.scheduledEnd
          ? new Date(values.scheduledEnd).toISOString()
          : null,
        isAutonomous: values.isAutonomous,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      reset(defaults);       // pastron formen
      setServerError(null);
      setOpen(false);        // mbyll modalin
    },
    onError: (err) => setServerError(getApiError(err, "Misioni nuk u krijua.")),
  });

  // Kur mbyllet modali pa ruajtur, forma pastrohet gjithsesi
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(defaults);
      setServerError(null);
    }
  }

  const missionType = watch("missionType");
  const flightZoneId = watch("flightZoneId");
  const isAutonomous = watch("isAutonomous");
  const selectedZone = zones?.find((z) => z.id === flightZoneId);

  // Ora minimale e lejuar — tani
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Mision i ri
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Krijo mision</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Titulli</Label>
            <Input
              id="title"
              placeholder="Inspektim i parcelës veriore"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipi</Label>
              <Select
                value={missionType}
                onValueChange={(v) =>
                  setValue("missionType", v as FormValues["missionType"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {missionTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fluturimi</Label>
              <Select
                value={isAutonomous ? "auto" : "pilot"}
                onValueChange={(v) =>
                  setValue("isAutonomous", v === "auto", { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Autonom</SelectItem>
                  <SelectItem value="pilot">Me pilot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Zona e fluturimit</Label>
            <Select
              value={flightZoneId}
              onValueChange={(v) =>
                setValue("flightZoneId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger aria-invalid={!!errors.flightZoneId}>
                <SelectValue placeholder="Zgjidh zonën" />
              </SelectTrigger>
              <SelectContent>
                {zones?.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name}
                    {z.isRestricted && " · e kufizuar"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.flightZoneId && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.flightZoneId.message}
              </p>
            )}

            {selectedZone?.isRestricted && isAutonomous && (
              <p className="text-[12px] text-[var(--status-caution)]">
                Kjo zonë kërkon pilot mbikëqyrës edhe për fluturim autonom.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Fillimi</Label>
              <Input
                id="start"
                type="datetime-local"
                min={nowLocal}
                aria-invalid={!!errors.scheduledStart}
                {...register("scheduledStart")}
              />
              {errors.scheduledStart && (
                <p className="text-[12px] text-[var(--status-warning)]">
                  {errors.scheduledStart.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">Mbarimi</Label>
              <Input
                id="end"
                type="datetime-local"
                min={nowLocal}
                aria-invalid={!!errors.scheduledEnd}
                {...register("scheduledEnd")}
              />
              {errors.scheduledEnd && (
                <p className="text-[12px] text-[var(--status-warning)]">
                  {errors.scheduledEnd.message}
                </p>
              )}
            </div>
          </div>

          {serverError && (
            <p className="text-[13px] text-[var(--status-warning)]">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Anulo
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Duke krijuar..." : "Krijo misionin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}