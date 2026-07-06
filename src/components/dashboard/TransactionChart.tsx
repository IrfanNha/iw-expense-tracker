"use client";

/**
 * TransactionChart
 *
 * Renders the correct chart (IncomeExpenseChart or DonutChart) based on the
 * active tab. Handles loading skeleton and empty states.
 */
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/DonutChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { PercentageModeToggle } from "@/components/ui/PercentageModeToggle";
import { PercentageMode } from "@/types/finance";
import type { ActiveTab, Period } from "@/types/dashboard";
import type { CategoryDatum, PeriodTotals } from "@/hooks/usePeriodTransactions";
import { formatDateRangeDisplay } from "@/lib/dateUtils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 animate-pulse">
      {/* Donut placeholder */}
      <div className="relative">
        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-muted" />
        <div className="absolute inset-0 m-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-background" />
      </div>
      {/* Legend rows */}
      <div className="w-full space-y-2 px-4 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-muted shrink-0" />
            <div className="h-3 flex-1 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function ChartEmpty({ tab }: { tab: ActiveTab }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 md:py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <svg
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">No data yet</p>
      <p className="text-xs text-muted-foreground">
        No {tab === "income" ? "income" : "expense"} transactions in this period
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TransactionChartProps {
  activeTab: ActiveTab;
  period: Period;
  selectedDate: Date;
  periodTotals: PeriodTotals;
  categoryData: CategoryDatum[];
  totalAmount: number;
  percentageMode: PercentageMode;
  onModeChange: (mode: PercentageMode) => void;
  isLoading: boolean;
}

export const TransactionChart = React.memo(function TransactionChart({
  activeTab,
  period,
  selectedDate,
  periodTotals,
  categoryData,
  totalAmount,
  percentageMode,
  onModeChange,
  isLoading,
}: TransactionChartProps) {
  const chartTitle =
    activeTab === "all"
      ? "Expense & Savings"
      : activeTab === "expense"
      ? "Expense by Category"
      : "Income by Category";

  return (
    <Card className="border border-border/60 rounded-xl shadow-none bg-background">
      <CardHeader className="px-4 pt-4 pb-3 md:px-5 md:pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm md:text-base font-semibold">
              {chartTitle}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {formatDateRangeDisplay(selectedDate, period)}
            </CardDescription>
          </div>
          {activeTab === "all" && (
            <PercentageModeToggle
              mode={percentageMode}
              onModeChange={onModeChange}
              hasIncome={periodTotals.income > 0}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 md:px-5 md:pb-5">
        {isLoading ? (
          <ChartSkeleton />
        ) : activeTab === "all" ? (
          <IncomeExpenseChart
            income={periodTotals.income}
            expense={periodTotals.expense}
            mode={percentageMode}
          />
        ) : categoryData.length > 0 ? (
          <DonutChart
            data={categoryData}
            totalAmount={totalAmount}
            title={`Total ${activeTab === "expense" ? "Expense" : "Income"}`}
          />
        ) : (
          <ChartEmpty tab={activeTab} />
        )}
      </CardContent>
    </Card>
  );
});
