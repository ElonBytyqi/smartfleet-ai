"use client";

import { Mission } from "@/lib/types";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

export function MissionChart({ missions }: { missions: Mission[] | undefined }) {
  // 14 ditet e fundit
  const days: { day: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, label: key.slice(8), count: 0 });
  }

  missions?.forEach((m) => {
    const key = m.scheduledStart.slice(0, 10);
    const entry = days.find((d) => d.day === key);
    if (entry) entry.count += 1;
  });

  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <section className="bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="font-heading text-sm font-semibold">
          Aktiviteti — 14 ditët e fundit
        </h2>
      </div>
      <p className="mb-4 font-mono text-[11px] text-muted-foreground">
        {total} misione gjithsej
      </p>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={days} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
          />
          <Bar dataKey="count" fill="var(--primary)" radius={[2, 2, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}