"use client";

import { LiveDrone } from "@/lib/use-telemetry";
import { Video, VideoOff, Maximize2, Circle } from "lucide-react";

export function CameraPanel({ drone }: { drone: LiveDrone }) {
  // Video streaming vjen me PX4 SITL + Gazebo ose me dron fizik
  const streamAvailable = false;

  return (
    <div className="flex h-full flex-col">
      {/* Pamja */}
      <div className="relative aspect-video shrink-0 bg-black">
        {streamAvailable ? (
          <video className="h-full w-full object-cover" autoPlay muted playsInline />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <VideoOff
              className="h-7 w-7 text-white/25"
              strokeWidth={1.5}
            />
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
              Pa sinjal
            </p>
          </div>
        )}

        {/* Overlay si te pamja e kamerës reale */}
        <div className="pointer-events-none absolute inset-0 p-3 font-mono text-[10px] text-white/70">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <Circle
                className={`h-2 w-2 ${
                  streamAvailable
                    ? "fill-[var(--status-warning)] text-[var(--status-warning)]"
                    : "fill-white/25 text-white/25"
                }`}
              />
              <span className="uppercase tracking-wider">
                {streamAvailable ? "REC" : "OFFLINE"}
              </span>
            </div>
            <span>{drone.serialNumber}</span>
          </div>

          <div className="absolute bottom-3 left-3 space-y-0.5">
            <p>ALT {drone.altitudeMeters.toFixed(0)} m</p>
            <p>SPD {drone.groundSpeedMs.toFixed(1)} m/s</p>
          </div>

          <div className="absolute bottom-3 right-3 space-y-0.5 text-right">
            <p>HDG {drone.headingDegrees.toFixed(0)}°</p>
            <p>{drone.flightMode}</p>
          </div>

          {/* Kryqi qendror */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path
                d="M20 8 L20 15 M20 25 L20 32 M8 20 L15 20 M25 20 L32 20"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.35"
              />
              <circle
                cx="20"
                cy="20"
                r="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.35"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Kontrollet */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Kamera kryesore
        </span>
        <button
          disabled={!streamAvailable}
          className="cursor-pointer text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Ekran i plotë"
        >
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {/* Shpjegimi */}
      <div className="flex flex-1 items-start gap-3 px-4 py-4">
        <Video
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <div>
          <p className="text-[13px]">Transmetimi i drejtpërdrejtë</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Video feed aktivizohet kur droni lidhet përmes MAVLink me kamerë të
            konfiguruar, ose në simulim me PX4 SITL dhe Gazebo.
          </p>
        </div>
      </div>
    </div>
  );
}