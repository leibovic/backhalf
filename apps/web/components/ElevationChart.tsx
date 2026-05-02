"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ElevationPoint } from "@/lib/gpx";

interface ElevationChartProps {
  data: ElevationPoint[];
}

export function ElevationChart({ data }: ElevationChartProps) {
  const formatted = data.map((p) => ({
    km: (p.distanceM / 1000).toFixed(1),
    ele: Math.round(p.elevationM),
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="km"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(val) => [`${val} m`, "Elevation"]}
            labelFormatter={(label) => `${label} km`}
          />
          <Area
            type="monotone"
            dataKey="ele"
            stroke="#6366f1"
            strokeWidth={1.5}
            fill="url(#elevGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
