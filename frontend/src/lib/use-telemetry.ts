"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { tokens } from "@/lib/api";

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
    verticalSpeedMs?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  temperatureCelsius?: number | null;
  vibrationLevel?: number | null;
}

const HUB_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "").replace("/api/v1", "") +
  "/hubs/telemetry";

export function useTelemetry(initial: LiveDrone[] = []) {
  const [drones, setDrones] = useState<Map<string, LiveDrone>>(
    () => new Map(initial.map((d) => [d.droneId, d]))
  );

  const [connected, setConnected] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const token = tokens.access;

    if (!token) {
      console.warn("SignalR: access token mungon");
      return;
    }

    let disposed = false;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => tokens.access ?? "",
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.on("TelemetryUpdate", (data: LiveDrone) => {
      if (disposed) return;

      setDrones((prev) => {
        const next = new Map(prev);
        next.set(data.droneId, data);
        return next;
      });
    });

    connection.onreconnecting(() => {
      if (!disposed) {
        setConnected(false);
      }
    });

    connection.onreconnected(() => {
      if (!disposed) {
        setConnected(true);
      }
    });

    connection.onclose(() => {
      if (!disposed) {
        setConnected(false);
      }
    });

    const startConnection = async () => {
      try {
        if (
          connection.state ===
          signalR.HubConnectionState.Disconnected
        ) {
          await connection.start();

          if (!disposed) {
            setConnected(true);
            console.log("SignalR connected");
          }
        }
      } catch (err) {
        if (!disposed) {
          console.error("SignalR:", err);
        }
      }
    };

    startConnection();

    return () => {
      disposed = true;

      connection.off("TelemetryUpdate");

      if (
        connection.state ===
        signalR.HubConnectionState.Connected ||
        connection.state ===
        signalR.HubConnectionState.Reconnecting
      ) {
        connection.stop().catch((err) => {
          console.error("SignalR stop error:", err);
        });
      }

      connectionRef.current = null;
    };
  }, []);

  return {
    drones: Array.from(drones.values()),
    connected,
  };
}