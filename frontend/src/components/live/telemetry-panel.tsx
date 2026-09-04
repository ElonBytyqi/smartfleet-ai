"use client";

import { LiveDrone } from "@/lib/use-telemetry";
import { droneColor } from "@/lib/drone-colors";
import { FlightProgress } from "@/lib/flight-progress";
import { formatDistance, formatEta } from "@/lib/geo";
import {
  AlertTriangle,
  Navigation,
  Gauge,
  Radio,
  Thermometer,
} from "lucide-react";

function batteryColor(p: number) {
  if (p <= 15) return "var(--status-warning)";
  if (p <= 25) return "var(--status-caution)";
  return "var(--status-clear)";
}

function Metric({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-0.5 font-mono text-[15px] tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-[11px] text-muted-foreground">{unit}</span>
        )}
      </p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Gauge;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t px-5 py-4 first:border-t-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export function TelemetryPanel({
  drone,
  progress,
}: {
  drone: LiveDrone;
  progress?: FlightProgress;
}) {
  const color = droneColor(drone.droneId);
  const stale = drone.secondsSinceUpdate > 10;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Koka */}
      <div className="border-b px-5 py-4">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[15px] font-medium">
              {drone.serialNumber}
            </p>
            <p className="truncate text-[12px] text-muted-foreground">
              {drone.nickname ?? "—"}
            </p>
            {drone.missionTitle && (
              <p className="mt-1 truncate text-[12px]">{drone.missionTitle}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
              drone.isArmed
                ? "border-[var(--status-clear)]/35 bg-[var(--status-clear)]/10 text-[var(--status-clear)]"
                : "border-border bg-muted text-muted-foreground"
            }`}
          >
            {drone.isArmed ? "Armatosur" : "Në tokë"}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {drone.flightMode}
          </span>
          <span
            className={`ml-auto font-mono text-[10px] ${
              stale ? "text-[var(--status-caution)]" : "text-muted-foreground"
            }`}
          >
            {drone.secondsSinceUpdate}s
          </span>
        </div>
      </div>

      {/* Alarmet — lart, sepse kerkojne veprim */}
      {drone.warnings.length > 0 && (
        <div className="space-y-1.5 border-b bg-[var(--status-warning)]/8 px-5 py-3">
          {drone.warnings.map((w, i) => (
            <p
              key={i}
              className="flex items-start gap-2 text-[12px] text-[var(--status-warning)]"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Bateria */}
      <Section icon={Gauge} title="Energjia">
        <div className="mb-2 flex items-baseline justify-between">
          <span
            className="font-mono text-[26px] font-medium tabular-nums leading-none"
            style={{ color: batteryColor(drone.batteryPercentage) }}
          >
            {drone.batteryPercentage.toFixed(0)}
            <span className="text-[14px]">%</span>
          </span>
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
            {drone.batteryVoltage?.toFixed(1) ?? "—"} V
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${drone.batteryPercentage}%`,
              background: batteryColor(drone.batteryPercentage),
            }}
          />
        </div>
      </Section>

      {/* Fluturimi */}
      <Section icon={Navigation} title="Fluturimi">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Metric label="Lartësia" value={drone.altitudeMeters.toFixed(0)} unit="m" />
          <Metric
            label="Shpejtësia"
            value={drone.groundSpeedMs.toFixed(1)}
            unit="m/s"
          />
          <Metric
            label="Drejtimi"
            value={`${drone.headingDegrees.toFixed(0)}°`}
          />
          <Metric
            label="Vertikale"
            value={
              drone.verticalSpeedMs !== undefined
                ? `${drone.verticalSpeedMs > 0 ? "+" : ""}${drone.verticalSpeedMs.toFixed(1)}`
                : "—"
            }
            unit="m/s"
          />
        </div>
      </Section>

      {/* Navigimi */}
      {progress && (
        <Section icon={Navigation} title="Navigimi">
          <div className="mb-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">
                Pika {progress.currentLeg}/{progress.totalLegs}
              </span>
              <span className="font-mono text-[14px] tabular-nums">
                {progress.percentComplete.toFixed(0)}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress.percentComplete}%`, background: color }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Metric
              label="Deri te pika"
              value={formatDistance(progress.distanceToNext)}
            />
            <Metric
              label="E mbetur"
              value={formatDistance(progress.distanceRemaining)}
            />
            <Metric label="Koha" value={formatEta(progress.etaSeconds)} />
            <Metric
              label="Kursi"
              value={`${progress.bearingToNext.toFixed(0)}°`}
            />
          </div>
        </Section>
      )}

      {/* Sinjali */}
      <Section icon={Radio} title="Sinjali">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Metric
            label="Satelitë"
            value={drone.satelliteCount}
            color={
              drone.satelliteCount < 6 ? "var(--status-warning)" : undefined
            }
          />
          <Metric
            label="Fuqia"
            value={drone.signalStrength?.toFixed(0) ?? "—"}
            unit="%"
          />
        </div>
      </Section>

      {/* Sensoret */}
      <Section icon={Thermometer} title="Sensorët">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Metric
            label="Temperatura"
            value={drone.temperatureCelsius?.toFixed(0) ?? "—"}
            unit="°C"
          />
          <Metric
            label="Dridhjet"
            value={drone.vibrationLevel?.toFixed(0) ?? "—"}
            color={
              (drone.vibrationLevel ?? 0) > 55
                ? "var(--status-caution)"
                : undefined
            }
          />
        </div>
      </Section>

      {/* Pozicioni */}
      <Section icon={Navigation} title="Pozicioni">
        <p className="font-mono text-[12px] tabular-nums leading-relaxed">
          {drone.latitude.toFixed(6)}
          <br />
          {drone.longitude.toFixed(6)}
        </p>
      </Section>
    </div>
  );
}