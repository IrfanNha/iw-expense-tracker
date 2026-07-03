/**
 * AnnualSummaryCards — Server Component
 *
 * Menampilkan 4 kartu ringkasan finansial (Income, Expense, Net, Health).
 * Karena konten ini STATIS (tidak ada interaksi), ini berjalan di server
 * dan tidak mengirim JS ke klien — mengurangi TBT secara langsung.
 */

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

interface Props {
  totals: AnnualReportDTO["totals"];
}

export function AnnualSummaryCards({ totals }: Props) {
  const isDeficit = totals.expense > totals.income;

  return (
    <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Income Card */}
      <Card className="rounded-sm shadow-none">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Total Income</CardDescription>
          <CardTitle className="text-xl md:text-2xl text-green-600">
            {formatCurrency(totals.income)}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Expense Card */}
      <Card className="rounded-sm shadow-none">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Total Expense</CardDescription>
          <CardTitle className="text-xl md:text-2xl text-red-600">
            {formatCurrency(totals.expense)}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {totals.expenseRate.toFixed(1)}% of income
          </p>
        </CardHeader>
      </Card>

      {/* Net/Savings Card */}
      <Card className="rounded-sm shadow-none">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Net / Savings</CardDescription>
          <CardTitle
            className={`text-xl md:text-2xl ${
              isDeficit ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatCurrency(totals.net)}
          </CardTitle>
          <div className="flex items-center gap-1 mt-1">
            {isDeficit ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : (
              <TrendingUp className="h-3 w-3 text-green-600" />
            )}
            <p className="text-xs text-muted-foreground">
              {Math.abs(totals.savingRate).toFixed(1)}% of income
              {isDeficit && " (Deficit)"}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Health Card */}
      <Card
        className={
          isDeficit
            ? "border-red-200 dark:border-red-900 rounded-sm shadow-none"
            : "rounded-sm shadow-none"
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Financial Health</CardDescription>
          <CardTitle className="text-xl md:text-2xl">
            {isDeficit ? "Deficit" : "Surplus"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Expense: {totals.expenseRate.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Saved: {totals.savingRate.toFixed(0)}%
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
