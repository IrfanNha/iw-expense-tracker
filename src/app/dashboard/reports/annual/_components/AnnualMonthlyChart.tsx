"use client";

/**
 * AnnualMonthlyChart — Client Component (lazy loaded)
 *
 * WHY "use client": Recharts membutuhkan DOM dan window APIs.
 * WHY dynamic import: Mencegah Recharts masuk ke initial JS bundle.
 * Recharts hanya di-load SETELAH halaman muncul, tidak memblokir render awal.
 *
 * Ini adalah perbaikan kritis untuk TBT dan LCP.
 */

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

interface Props {
  monthlyTrend: AnnualReportDTO["monthlyTrend"];
}

/** Skeleton ditampilkan saat Recharts masih di-load */
function ChartSkeleton() {
  return (
    <div
      className="h-[300px] md:h-[400px] w-full animate-pulse rounded-lg bg-muted/40 flex items-center justify-center"
      aria-label="Loading chart..."
    >
      <span className="text-xs text-muted-foreground">Loading chart...</span>
    </div>
  );
}

/**
 * Recharts di-import secara lazy — tidak masuk ke initial bundle.
 * Ini menghilangkan Recharts dari blocking resources saat FCP.
 */
const LazyBarChart = dynamic(
  () =>
    import("recharts").then(({ ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend }) => {
      return function BarChartContent({ data }: { data: Props["monthlyTrend"] }) {
        return (
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="monthName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  tickFormatter={(value: string) => value.substring(0, 3)}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  tickFormatter={(value: number) => {
                    if (value === 0) return "0";
                    return `${(value / 1000).toFixed(0)}k`;
                  }}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: "8px", 
                    fontSize: "12px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    backgroundColor: "hsl(var(--background))",
                    color: "hsl(var(--foreground))"
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))"
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} 
                  iconType="circle"
                />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" fill="#f43f5e" name="Expense" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="net" fill="#3b82f6" name="Net" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      };
    }),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export function AnnualMonthlyChart({ monthlyTrend }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6 transition-colors hover:bg-accent/5">
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold">Monthly Trend</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Income, expense, and savings throughout the year
        </p>
      </div>
      <LazyBarChart data={monthlyTrend} />
    </div>
  );
}
