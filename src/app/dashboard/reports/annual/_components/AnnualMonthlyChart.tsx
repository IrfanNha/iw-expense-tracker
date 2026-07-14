"use client";

/**
 * AnnualMonthlyChart — Client Component (lazy loaded)
 *
 * ComposedChart: Income bar + Expense bar + Net line (with y=0 reference).
 * Net line color is blue; reference line at 0 makes surplus/deficit readable.
 */

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

interface Props {
  monthlyTrend: AnnualReportDTO["monthlyTrend"];
}

function ChartSkeleton() {
  return (
    <div
      className="h-[300px] md:h-[380px] w-full animate-pulse rounded-lg bg-muted/40 flex items-center justify-center"
      aria-label="Loading chart…"
    >
      <span className="text-xs text-muted-foreground">Loading chart…</span>
    </div>
  );
}

const LazyComposedChart = dynamic(
  () =>
    import("recharts").then(
      ({
        ResponsiveContainer,
        ComposedChart,
        Bar,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ReferenceLine,
      }) => {
        return function ComposedChartContent({ data }: { data: Props["monthlyTrend"] }) {
          return (
            <div className="h-[300px] md:h-[380px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="monthName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    tickFormatter={(v: string) => v.substring(0, 3)}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    tickFormatter={(v: number) =>
                      v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`
                    }
                    dx={-10}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.15)",
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                    iconType="circle"
                  />
                  {/* Reference line at zero helps read surplus vs deficit */}
                  <ReferenceLine
                    y={0}
                    stroke="hsl(var(--border))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <Bar
                    dataKey="income"
                    fill="#10b981"
                    name="Income"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#f43f5e"
                    name="Expense"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Line
                    dataKey="net"
                    stroke="#3b82f6"
                    name="Net"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
                    type="monotone"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          );
        };
      },
    ),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export function AnnualMonthlyChart({ monthlyTrend }: Props) {
  if (!monthlyTrend.length) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
        <div className="mb-5">
          <h2 className="text-base md:text-lg font-semibold">Monthly Trend</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Income, expense, and net savings throughout the year
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="text-sm font-medium text-foreground mb-1">No monthly data</p>
          <p className="text-xs text-muted-foreground">No transactions recorded in this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6 transition-colors hover:bg-accent/5">
      <div className="mb-5">
        <h2 className="text-base md:text-lg font-semibold">Monthly Trend</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Income, expense, and net savings throughout the year
        </p>
      </div>
      {/* overflow-hidden prevents ResponsiveContainer from expanding past card */}
      <div className="overflow-hidden min-w-0">
        <LazyComposedChart data={monthlyTrend} />
      </div>
    </div>
  );
}
