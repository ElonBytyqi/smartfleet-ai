"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

const roleLabels: Record<string, string> = {
  Admin: "Administrator",
  FleetManager: "Menaxher flote",
  Pilot: "Pilot",
  MaintenanceTechnician: "Teknik mirëmbajtjeje",
  Operator: "Operator",
};

const schema = z.object({
  fullName: z.string().min(3, "Emri duhet të ketë të paktën 3 karaktere."),
  email: z.string().email("Email i pavlefshëm."),
  password: z
    .string()
    .min(8, "Fjalëkalimi duhet të ketë të paktën 8 karaktere.")
    .regex(/\d/, "Fjalëkalimi duhet të përmbajë të paktën një shifër."),
  role: z.string().min(1, "Zgjidh një rol."),
  phoneNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  fullName: "",
  email: "",
  password: "",
  role: "",
  phoneNumber: "",
};

export function CreateUserDialog() {
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

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<string[]>("/users/roles")).data,
  });

  const mutation = useMutation({
    mutationFn: async (v: FormValues) =>
      api.post("/users", { ...v, phoneNumber: v.phoneNumber || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["pilots"] });
      reset(defaults);
      setServerError(null);
      setOpen(false);
    },
    onError: (err) => setServerError(getApiError(err, "Përdoruesi nuk u krijua.")),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(defaults);
      setServerError(null);
    }
  }

  const role = watch("role");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Përdorues i ri
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Shto përdorues</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Emri i plotë</Label>
            <Input
              id="name"
              placeholder="Blerim Krasniqi"
              aria-invalid={!!errors.fullName}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="blerim@smartfleet.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pass">Fjalëkalimi</Label>
            <Input
              id="pass"
              type="password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Roli</Label>
            <Select
              value={role}
              onValueChange={(v) => setValue("role", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.role}>
                <SelectValue placeholder="Zgjidh rolin" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabels[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-[12px] text-[var(--status-warning)]">
                {errors.role.message}
              </p>
            )}
            {role === "Pilot" && (
              <p className="text-[12px] text-muted-foreground">
                Profili i pilotit krijohet automatikisht.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoni (opsional)</Label>
            <Input id="phone" placeholder="+383 44 123 456" {...register("phoneNumber")} />
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