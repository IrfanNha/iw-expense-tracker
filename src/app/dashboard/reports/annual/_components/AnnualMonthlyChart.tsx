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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

interface Props {
  monthlyTrend: AnnualReportDTO["monthlyTrend"];
}

/** Skeleton ditampilkan saat Recharts masih di-load */
function ChartSkeleton() {
  return (
    <div
      className="h-[300px] md:h-[400px] w-full animate-pulse rounded bg-muted/40 flex items-center justify-center"
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) => value.substring(0, 3)}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                <Bar dataKey="net" fill="#3b82f6" name="Net" />
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
    <Card className="border rounded-none sm:rounded-sm shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Monthly Trend</CardTitle>
        <CardDescription className="text-xs">
          Income, expense, and savings throughout the year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LazyBarChart data={monthlyTrend} />
      </CardContent>
    </Card>
  );
}
