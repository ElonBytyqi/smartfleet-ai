"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

export interface LiveDrone {
  droneId: string;
  serialNumber: string;
  nickname: string | null;
  droneStatus: string;
  missionId: string | null;
  missionTitle: string | null;
  timestamp: string;
  secondsSinceUpdate: number;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  groundSpeedMs: number;
  headingDegrees: number;
  batteryPercentage: number;
  satelliteCount: number;
  flightMode: string;
  isArmed: boolean;
  warnings: string[];
}

const HUB_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "").replace("/api/v1", "") +
  "/hubs/telemetry";

export function useTelemetry(initial: LiveDrone[] = []) {
  // Mbajme nje harte droneId -> gjendja e fundit
  const [drones, setDrones] = useState<Map<string, LiveDrone>>(
    () => new Map(initial.map((d) => [d.droneId, d]))
  );
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("accessToken") ?? "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("TelemetryUpdate", (data: LiveDrone) => {
      setDrones((prev) => {
        const next = new Map(prev);
        next.set(data.droneId, data);
        return next;
      });
    });

    connection.onreconnected(() => setConnected(true));
    connection.onreconnecting(() => setConnected(false));
    connection.onclose(() => setConnected(false));

    connection
      .start()
      .then(() => setConnected(true))
      .catch((err) => console.error("SignalR:", err));

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  return {
    drones: Array.from(drones.values()),
    connected,
  };
}