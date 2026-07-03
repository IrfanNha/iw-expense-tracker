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
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header — client (interactive controls) */}
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
        <AnnualReportControls
          selectedYear={year}
          fromMonth={range.fromMonth}
          toMonth={range.toMonth}
        />
      </div>

      {!hasData ? (
        // EMPTY STATE — server rendered
        <Card className="rounded-sm shadow-none">
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Annual report is being prepared. Transaction summaries for{" "}
              <strong>{year}</strong> are not yet available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Executive Summary — server component (nol JS ke klien) */}
          <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
            <h2 className="text-lg md:text-xl font-semibold mb-3">
              Executive Summary
            </h2>
            <AnnualSummaryCards totals={totals} />
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
