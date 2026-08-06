"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Drone } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DronesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["drones"],
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header — karte e vecante, si te misionet */}
      <header className="flex items-center justify-between rounded-lg border bg-card px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-base font-semibold">Dronët</h1>
          <span className="font-mono text-[13px] text-muted-foreground">
            {data?.length ?? 0}
          </span>
        </div>
      </header>

      {/* Lista */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6 text-[13px] font-medium text-foreground">
                Numri serik
              </TableHead>
              <TableHead className="font-medium text-foreground">Nofka</TableHead>
              <TableHead className="font-medium text-foreground">Modeli</TableHead>
              <TableHead className="font-medium text-foreground">Statusi</TableHead>
              <TableHead className="px-6 text-right font-medium text-foreground">
                Orë fluturimi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Duke ngarkuar...
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-[var(--status-warning)]">
                  Nuk u morën dot të dhënat.
                </TableCell>
              </TableRow>
            )}

            {data?.map((drone) => (
              <TableRow key={drone.id}>
                <TableCell className="px-6 py-4 font-mono font-medium">
                  <Link
                    href={`/drones/${drone.id}`}
                    className="font-mono font-medium hover:text-primary"
                  >
                  {drone.serialNumber}</Link>
                </TableCell>
                <TableCell className="py-4 font-medium">
                  {drone.nickname ?? "—"}
                </TableCell>
                <TableCell className="py-4 text-muted-foreground">
                  {drone.modelName ?? "—"}
                </TableCell>
                <TableCell className="py-4">
                  <StatusBadge status={drone.status} />
                </TableCell>
                <TableCell className="px-6 py-4 text-right font-mono tabular-nums">
                  {drone.totalFlightHours.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}

            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Ende s&apos;ka dronë të regjistruar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}