/**
 * AnnualCategorySection — Server Component wrapper
 *
 * Bagian list kategori berjalan di server (statis).
 * DonutChart sudah lazy-loaded dari awal (dynamic import di DonutChart.tsx).
 *
 * Struktur ini mempertahankan layout yang sama persis dengan sebelumnya.
 */

import { DonutChart } from "@/components/charts/DonutChart";
import { CHART_COLORS } from "@/lib/colors";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

interface Props {
  topCategories: AnnualReportDTO["topCategories"];
  totalExpense: number;
}

export function AnnualCategorySection({ topCategories, totalExpense }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6 transition-colors hover:bg-accent/10">
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold">Top Expense Categories</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Where your money goes (percentage of total expense)
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 items-center">
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <DonutChart
            data={topCategories.map((cat) => ({
              name: cat.categoryName,
              value: cat.amount,
              percentage: cat.percentageOfExpense.toFixed(1),
            }))}
            totalAmount={totalExpense}
            title="Total Expense"
          />
        </div>

        {/* Category Breakdown List */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
            Top Spend Breakdown
          </h3>
          <div className="space-y-3">
            {topCategories.map((category, index) => (
              <div key={category.categoryId} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-sm font-medium truncate">
                      {category.categoryName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">
                      {formatCurrency(category.amount)}
                    </p>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${category.percentageOfExpense}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right tabular-nums">
                    {category.percentageOfExpense.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
