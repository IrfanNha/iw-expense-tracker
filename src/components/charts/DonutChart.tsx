"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/money";
import { CHART_COLORS } from "@/lib/colors";

interface DonutChartProps {
  data: Array<{ name: string; value: number; percentage: string }>;
  totalAmount: number;
  title: string;
}

// ─── Dynamic chart with center-label overlay ──────────────────────────────────

const ChartContent = dynamic(
  () => import("recharts").then((recharts) => {
    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = recharts;

    return function ChartContentComponent({
      data,
      centerLabel,
      centerSublabel,
    }: {
      data: DonutChartProps["data"];
      centerLabel: string;
      centerSublabel: string;
    }) {
      return (
        <div className="relative w-full" style={{ height: "clamp(150px, 22vw, 200px)" }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="42%"
                outerRadius="65%"
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm sm:text-base md:text-lg font-bold leading-none">
              {centerLabel}
            </span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 leading-none">
              {centerSublabel}
            </span>
          </div>
        </div>
      );
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: "clamp(150px, 22vw, 200px)" }}
      >
        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-muted animate-pulse" />
      </div>
    ),
  }
);

// ─── Main component ───────────────────────────────────────────────────────────

export function DonutChart({ data, totalAmount, title }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No data available</p>
        <p className="text-xs text-muted-foreground">No transactions this period</p>
      </div>
    );
  }

  const centerLabel = formatCurrency(totalAmount);
  const centerSublabel = title;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Donut with center label */}
      <ChartContent
        data={data}
        centerLabel={centerLabel}
        centerSublabel={centerSublabel}
      />

      {/* Category legend */}
      <div className="space-y-1.5 sm:space-y-2 max-h-[160px] overflow-y-auto pr-0.5">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-[10px] sm:text-xs"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate text-muted-foreground">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <span className="text-muted-foreground/70">{item.percentage}%</span>
              <span className="font-semibold text-right min-w-[60px]">
                {formatCurrency(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
