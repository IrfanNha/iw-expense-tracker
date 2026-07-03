/**
 * AnnualCategorySection — Server Component wrapper
 *
 * Bagian list kategori berjalan di server (statis).
 * DonutChart sudah lazy-loaded dari awal (dynamic import di DonutChart.tsx).
 *
 * Struktur ini mempertahankan layout yang sama persis dengan sebelumnya.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/DonutChart";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

interface Props {
  topCategories: AnnualReportDTO["topCategories"];
  totalExpense: number;
}

export function AnnualCategorySection({ topCategories, totalExpense }: Props) {
  return (
    <Card className="border rounded-none sm:rounded-sm shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Top Expense Categories</CardTitle>
        <CardDescription className="text-xs">
          Where your money goes (percentage of total expense)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
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

          {/* Category List */}
          <div className="space-y-2">
            {topCategories.map((category, index) => (
              <div
                key={category.categoryId}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      background: `hsl(var(--chart-${(index % 5) + 1}))`,
                    }}
                  />
                  <span className="text-xs md:text-sm font-medium truncate">
                    {category.categoryName}
                  </span>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs md:text-sm font-semibold">
                    {formatCurrency(category.amount)}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    {category.percentageOfExpense.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
