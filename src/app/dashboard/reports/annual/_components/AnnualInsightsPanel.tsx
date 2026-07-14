/**
 * AnnualInsightsPanel — Server Component
 *
 * Financial insights rendered as a professional row-based table,
 * consistent with AnnualRatiosSection style.
 * Zero JS shipped to the client.
 */

import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  insights: AnnualReportDTO["insights"];
  totals: AnnualReportDTO["totals"];
  monthlyTrend: AnnualReportDTO["monthlyTrend"];
}

// ─── Shared row — same shape as AnnualRatiosSection ──────────────────────────

function InsightRow({
  label,
  note,
  value,
  valueSub,
  status,
}: {
  label: string;
  note?: string;
  value: string;
  valueSub?: string;
  status: "positive" | "neutral" | "warning" | "critical";
}) {
  const dotColor = {
    positive: "bg-emerald-500",
    neutral:  "bg-muted-foreground/40",
    warning:  "bg-amber-500",
    critical: "bg-rose-500",
  }[status];

  const valueColor = {
    positive: "text-emerald-500",
    neutral:  "text-foreground",
    warning:  "text-amber-500",
    critical: "text-rose-500",
  }[status];

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground leading-none truncate">{label}</p>
        {note && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">{note}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 text-right">
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
        <div>
          <p className={cn("text-sm font-semibold tabular-nums leading-none", valueColor)}>
            {value}
          </p>
          {valueSub && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{valueSub}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnnualInsightsPanel({ insights, totals, monthlyTrend }: Props) {
  const isDeficit = totals.expense > totals.income;

  const avgMonthlyExpense =
    monthlyTrend.length > 0
      ? monthlyTrend.reduce((s, m) => s + m.expense, 0) / monthlyTrend.length
      : 0;

  const peakMonth = insights.highestExpenseMonth
    ? monthlyTrend.find((m) => m.month === insights.highestExpenseMonth)
    : null;

  const peakAboveAvg =
    peakMonth && avgMonthlyExpense > 0
      ? ((peakMonth.expense - avgMonthlyExpense) / avgMonthlyExpense) * 100
      : null;

  const lowestSavingData = insights.lowestSavingMonth
    ? monthlyTrend.find((m) => m.month === insights.lowestSavingMonth)
    : null;

  const bestSavingData =
    monthlyTrend.length > 0
      ? monthlyTrend.reduce((best, m) => (m.net > best.net ? m : best), monthlyTrend[0])
      : null;

  const volatilityStatus: "positive" | "neutral" | "warning" | "critical" =
    insights.expenseVolatility === "LOW" ? "positive"
    : insights.expenseVolatility === "MEDIUM" ? "neutral"
    : "critical";

  const volatilityValue =
    insights.expenseVolatility === "LOW" ? "Stable"
    : insights.expenseVolatility === "MEDIUM" ? "Moderate"
    : "Erratic";

  const volatilityNote =
    insights.expenseVolatility === "LOW" ? "Predictable month-to-month spending"
    : insights.expenseVolatility === "MEDIUM" ? "Minor variation across months"
    : "High variation - consider stricter budgets";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-semibold">Financial Insights</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Key patterns and action points based on your activity
        </p>
      </div>

      {/* Deficit alert — inline banner, not a card */}
      {isDeficit && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-rose-500 font-semibold uppercase tracking-wider text-[10px] shrink-0">
            Deficit
          </span>
          <span className="text-muted-foreground">
            Spending exceeded income by{" "}
            <strong className="text-foreground tabular-nums">
              {formatCurrency(Math.abs(totals.net))}
            </strong>
            . Review largest expense categories.
          </span>
        </div>
      )}

      {/* Two-column row table — mirrors AnnualRatiosSection */}
      <div className="grid gap-x-8 md:grid-cols-2">
        {/* Left column */}
        <div>
          {peakMonth && (
            <InsightRow
              label="Peak Spending Month"
              note={
                peakAboveAvg !== null && peakAboveAvg > 0
                  ? `${peakAboveAvg.toFixed(0)}% above monthly average`
                  : "Highest expense month"
              }
              value={MONTH_NAMES[peakMonth.month - 1]}
              valueSub={formatCurrency(peakMonth.expense)}
              status="warning"
            />
          )}

          {lowestSavingData && (
            <InsightRow
              label="Weakest Saving Month"
              note="Lowest net savings recorded"
              value={MONTH_NAMES[lowestSavingData.month - 1]}
              valueSub={formatCurrency(lowestSavingData.net)}
              status={lowestSavingData.net < 0 ? "critical" : "warning"}
            />
          )}

          {bestSavingData && bestSavingData.net > 0 && (
            <InsightRow
              label="Best Saving Month"
              note="Highest net savings recorded"
              value={bestSavingData.monthName}
              valueSub={`+${formatCurrency(bestSavingData.net)}`}
              status="positive"
            />
          )}
        </div>

        {/* Right column */}
        <div>
          <InsightRow
            label="Spending Consistency"
            note={volatilityNote}
            value={volatilityValue}
            status={volatilityStatus}
          />

          <InsightRow
            label="Annual Cash Flow"
            note={isDeficit ? "Spending exceeds income" : "Income exceeds spending"}
            value={isDeficit ? "Deficit" : "Surplus"}
            valueSub={formatCurrency(Math.abs(totals.net))}
            status={isDeficit ? "critical" : "positive"}
          />

          <InsightRow
            label="Active Months"
            note={`${monthlyTrend.length} month${monthlyTrend.length !== 1 ? "s" : ""} with transactions`}
            value={`${monthlyTrend.length} mo`}
            status="neutral"
          />
        </div>
      </div>
    </div>
  );
}
