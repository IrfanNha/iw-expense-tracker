"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/money";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e"
];

interface DonutChartProps {
  data: Array<{ name: string; value: number; percentage: string }>;
  totalAmount: number;
  title: string;
}

// Dynamic import for the entire chart component
const ChartContent = dynamic(
  () => import("recharts").then((recharts) => {
    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = recharts;
    
    return function ChartContentComponent({ data }: { data: DonutChartProps["data"] }) {
      return (
        <div className="w-full" style={{ height: "clamp(140px, 20vw, 180px)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="60%"
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    };
  }),
  { 
    ssr: false,
    loading: () => <div className="text-center py-8 text-muted-foreground text-xs">Loading chart...</div>
  }
);

export function DonutChart({ data, totalAmount, title }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4">
      <div className="text-center">
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
          {formatCurrency(totalAmount)}
        </p>
        <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
          {title}
        </p>
      </div>
      <ChartContent data={data} />
      <div className="space-y-1.5 sm:space-y-2 max-h-[150px] sm:max-h-[180px] md:max-h-[200px] overflow-y-auto">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <div
                className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate">{item.name}</span>
            </div>
            <div className="text-right flex-shrink-0 ml-1.5 sm:ml-2">
              <span className="font-semibold">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

