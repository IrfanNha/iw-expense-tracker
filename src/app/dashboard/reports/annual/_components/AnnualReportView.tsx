/**
 * AnnualReportView — Thin Compositor (Server Component)
 *
 * Assembles all sub-components for the annual report.
 * Client boundary is limited to: AnnualReportControls, AnnualMonthlyChart, MonthlyCategoryBrowser.
 * All other sections are Server Components — zero JS shipped for them.
 */

import { type AnnualReportDTO } from "@/lib/report/annual-report";
import { Info } from "lucide-react";
import { AnnualReportControls } from "./AnnualReportControls";
import { AnnualSummaryCards } from "./AnnualSummaryCards";
import { AnnualRatiosSection } from "./AnnualRatiosSection";
import { AnnualMonthlyChart } from "./AnnualMonthlyChart";
import { AnnualCategorySection } from "./AnnualCategorySection";
import { MonthlyCategoryBrowser } from "./MonthlyCategoryBrowser";
import { AnnualInsightsPanel } from "./AnnualInsightsPanel";

interface AnnualReportViewProps {
  reportData: AnnualReportDTO;
}

export function AnnualReportView({ reportData }: AnnualReportViewProps) {
  const { year, range, totals, monthlyTrend, topCategories, monthlyCategoryBreakdown, ratios, insights } = reportData;
  const hasData = totals.income > 0 || totals.expense > 0;
  const monthsCount = range.toMonth - range.fromMonth + 1;

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-6 pt-4 md:pt-6 pb-8">
      {/* Header controls — client (year selector, period, resync) */}
      <AnnualReportControls
        selectedYear={year}
        fromMonth={range.fromMonth}
        toMonth={range.toMonth}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Info className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">No Data Available</h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            No transactions recorded for{" "}
            <strong className="text-foreground">{year}</strong> in the selected period.
            Add transactions or adjust the date range.
          </p>
        </div>
      ) : (
        <>
          {/* 1 — Executive Summary */}
          <AnnualSummaryCards totals={totals} monthsCount={monthsCount} />

          {/* 2 — Key Financial Ratios */}
          <AnnualRatiosSection ratios={ratios} monthsCount={monthsCount} />

          {/* 3 — Monthly Trend Chart (Income/Expense bars + Net line) */}
          <AnnualMonthlyChart monthlyTrend={monthlyTrend} />

          {/* 4 — Annual Top Expense Categories */}
          {topCategories.length > 0 && (
            <AnnualCategorySection
              topCategories={topCategories}
              totalExpense={totals.expense}
            />
          )}

          {/* 5 — Monthly Category Browser (interactive, client) */}
          <MonthlyCategoryBrowser breakdown={monthlyCategoryBreakdown} />

          {/* 6 — Financial Insights */}
          <AnnualInsightsPanel
            insights={insights}
            totals={totals}
            monthlyTrend={monthlyTrend}
          />
        </>
      )}
    </div>
  );
}
