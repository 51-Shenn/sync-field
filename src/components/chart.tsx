"use client";

import * as React from "react";
import type { TooltipContentProps } from "recharts";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  { label: React.ReactNode; color: string }
>;

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChart() {
  const config = React.useContext(ChartContext);
  if (!config) throw new Error("Chart components must be used inside ChartContainer");
  return config;
}

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}) {
  const variables = Object.fromEntries(
    Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={config}>
      <div
        data-chart
        className={cn(
          "flex min-h-64 w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-400 [&_.recharts-cartesian-grid_line]:stroke-slate-100 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-200 [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        style={variables}
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 280 }}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  valueFormatter,
}: Pick<TooltipContentProps, "active" | "payload" | "label"> & {
  hideLabel?: boolean;
  valueFormatter?: (value: number | string) => string;
}) {
  const config = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 text-xs shadow-xl shadow-slate-950/10 backdrop-blur-md">
      {!hideLabel && label != null ? <p className="mb-2 font-semibold text-slate-900">{String(label)}</p> : null}
      <div className="space-y-1.5">
        {payload.map((item) => {
          const payloadStatus = typeof item.payload === "object" && item.payload && "status" in item.payload
            ? String(item.payload.status)
            : null;
          const key = payloadStatus ?? String(item.dataKey ?? item.name ?? "value");
          const chartItem = config[key];
          const rawValue = item.value ?? "—";
          const value = typeof rawValue === "string" || typeof rawValue === "number" ? rawValue : rawValue.join("–");
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="size-2 rounded-[3px]" style={{ backgroundColor: item.color ?? chartItem?.color }} />
              <span className="flex-1 text-slate-500">{chartItem?.label ?? item.name ?? key}</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {valueFormatter ? valueFormatter(value) : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartLegendContent({ keys }: { keys: string[] }) {
  const config = useChart();
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3">
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="size-2 rounded-[3px]" style={{ backgroundColor: config[key]?.color }} />
          {config[key]?.label ?? key}
        </div>
      ))}
    </div>
  );
}
