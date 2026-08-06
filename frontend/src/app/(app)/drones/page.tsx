"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
import { Card } from "@/components/ui/card";

export default function DronesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["drones"],
    queryFn: async () => (await api.get<Drone[]>("/drones")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Dronët</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.length} dronë të regjistruar` : "Duke ngarkuar..."}
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numri serik</TableHead>
              <TableHead>Nofka</TableHead>
              <TableHead>Modeli</TableHead>
              <TableHead>Statusi</TableHead>
              <TableHead className="text-right">Orë fluturimi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Duke ngarkuar...
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive py-8">
                  Nuk u morën dot të dhënat.
                </TableCell>
              </TableRow>
            )}

            {data?.map((drone) => (
              <TableRow key={drone.id}>
                <TableCell className="font-mono text-sm">
                  {drone.serialNumber}
                </TableCell>
                <TableCell>{drone.nickname ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {drone.modelName ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={drone.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {drone.totalFlightHours.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}

            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Ende s{"'"}ka dronë të regjistruar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}