/**
 * AnnualReportView — Thin Compositor (Server Component by default)
 *
 * BEFORE: Monolith "use client" 474 baris — seluruhnya JS di klien.
 * AFTER:  Kompositor tipis yang merakit sub-components.
 *         - Client boundary HANYA di AnnualReportControls dan AnnualMonthlyChart
 *         - AnnualSummaryCards & AnnualInsightsPanel berjalan di server (nol JS)
 *
 * Dampak: TBT turun drastis karena lebih sedikit JS yang harus di-parse/execute.
 */

import { type AnnualReportDTO } from "@/lib/report/annual-report";
import { Info } from "lucide-react";
import { AnnualReportControls } from "./AnnualReportControls";
import { AnnualSummaryCards } from "./AnnualSummaryCards";
import { AnnualMonthlyChart } from "./AnnualMonthlyChart";
import { AnnualCategorySection } from "./AnnualCategorySection";
import { AnnualInsightsPanel } from "./AnnualInsightsPanel";

interface AnnualReportViewProps {
  reportData: AnnualReportDTO;
}

export function AnnualReportView({ reportData }: AnnualReportViewProps) {
  const { year, range, totals, monthlyTrend, topCategories, insights } = reportData;
  const hasData = totals.income > 0 || totals.expense > 0;
  
  // Calculate average monthly income and expense for the summary cards
  const monthsCount = range.toMonth - range.fromMonth + 1;

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-6 pt-4 md:pt-6 pb-8">
      {/* Header — client (interactive controls) */}
      <AnnualReportControls
        selectedYear={year}
        fromMonth={range.fromMonth}
        toMonth={range.toMonth}
      />

      {!hasData ? (
        // EMPTY STATE — server rendered
        <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Info className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">No Data Available</h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            Annual report is being prepared. Transaction summaries for{" "}
            <strong className="text-foreground">{year}</strong> are not yet available.
          </p>
        </div>
      ) : (
        <>
          {/* Executive Summary — server component (nol JS ke klien) */}
          <div className="pt-2">
            <h2 className="text-base md:text-lg font-semibold mb-4">
              Executive Summary
            </h2>
            <AnnualSummaryCards totals={totals} monthsCount={monthsCount} />
          </div>

          {/* Monthly Trend — client (chart needs DOM/window) */}
          <AnnualMonthlyChart monthlyTrend={monthlyTrend} />

          {/* Category Breakdown — wraps DonutChart (already lazy) */}
          {topCategories.length > 0 && (
            <AnnualCategorySection
              topCategories={topCategories}
              totalExpense={totals.expense}
            />
          )}

          {/* Insights — server component (nol JS ke klien) */}
          <AnnualInsightsPanel insights={insights} totals={totals} />
        </>
      )}
    </div>
  );
}
