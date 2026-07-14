/**
 * AnnualRatiosSection — Server Component
 *
 * Key financial ratios. Mature, information-dense layout.
 * Zero JS shipped to the client.
 */

import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { AnnualRatios } from "@/lib/report/annual-report";

interface Props {
  ratios: AnnualRatios;
  monthsCount: number;
}

// Status dot — small colored indicator, no background noise
function StatusDot({ status }: { status: "positive" | "neutral" | "warning" | "critical" }) {
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", {
        "bg-emerald-500": status === "positive",
        "bg-muted-foreground/40": status === "neutral",
        "bg-amber-500": status === "warning",
        "bg-rose-500": status === "critical",
      })}
    />
  );
}

// Compact ratio row — label / value / status on one line
function RatioRow({
  label,
  value,
  note,
  status,
  largeValue = false,
}: {
  label: string;
  value: string;
  note?: string;
  status: "positive" | "neutral" | "warning" | "critical";
  largeValue?: boolean;
}) {
  const valueColor = {
    positive: "text-emerald-500",
    neutral: "text-foreground",
    warning: "text-amber-500",
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
      <div className="flex items-center gap-2 shrink-0">
        <StatusDot status={status} />
        <span
          className={cn(
            "font-semibold tabular-nums",
            largeValue ? "text-base" : "text-sm",
            valueColor,
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function AnnualRatiosSection({ ratios, monthsCount }: Props) {
  const {
    savingsRate,
    expenseRatio,
    avgMonthlyIncome,
    avgMonthlyExpense,
    monthsOfSurplus,
    deficitMonthsCount,
    bestSavingMonth,
    worstSpendingMonth,
    consistencyScore,
  } = ratios;

  const savingsStatus: "positive" | "warning" | "critical" =
    savingsRate >= 20 ? "positive" : savingsRate >= 5 ? "warning" : "critical";

  const expenseStatus: "positive" | "warning" | "critical" =
    expenseRatio <= 70 ? "positive" : expenseRatio <= 90 ? "warning" : "critical";

  const consistencyStatus = {
    EXCELLENT: "positive",
    GOOD: "neutral",
    FAIR: "warning",
    POOR: "critical",
  }[consistencyScore] as "positive" | "neutral" | "warning" | "critical";

  const surplusStatus: "positive" | "warning" | "critical" =
    monthsOfSurplus !== null && monthsOfSurplus >= 1 ? "positive"
    : deficitMonthsCount > 0 ? "critical"
    : "warning";

  const surplusValue =
    monthsOfSurplus !== null
      ? `${monthsOfSurplus.toFixed(1)} mo`
      : deficitMonthsCount > 0
      ? `${deficitMonthsCount} mo`
      : "-";

  const surplusNote =
    monthsOfSurplus !== null
      ? "of avg spending covered"
      : deficitMonthsCount > 0
      ? `${deficitMonthsCount} of ${monthsCount} months in deficit`
      : "No deficit";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-semibold">Financial Ratios</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Key metrics to evaluate your financial health
        </p>
      </div>

      {/* Two-column ratio table */}
      <div className="grid gap-x-8 md:grid-cols-2">
        {/* Left column */}
        <div>
          <RatioRow
            label="Savings Rate"
            note={savingsRate >= 20 ? "On track" : savingsRate >= 5 ? "Can improve" : "Needs attention"}
            value={`${savingsRate.toFixed(1)}%`}
            status={savingsStatus}
            largeValue
          />
          <RatioRow
            label="Expense Ratio"
            note="of income spent"
            value={`${expenseRatio.toFixed(1)}%`}
            status={expenseStatus}
            largeValue
          />
          <RatioRow
            label={monthsOfSurplus !== null ? "Surplus Runway" : "Deficit Months"}
            note={surplusNote}
            value={surplusValue}
            status={surplusStatus}
            largeValue
          />
        </div>

        {/* Right column */}
        <div>
          <RatioRow
            label="Avg Monthly Income"
            note={`over ${monthsCount} month${monthsCount !== 1 ? "s" : ""}`}
            value={formatCurrency(avgMonthlyIncome)}
            status="neutral"
          />
          <RatioRow
            label="Avg Monthly Expense"
            note="per month"
            value={formatCurrency(avgMonthlyExpense)}
            status={expenseStatus}
          />
          <RatioRow
            label="Spending Consistency"
            note={
              consistencyScore === "EXCELLENT" ? "Very stable"
              : consistencyScore === "GOOD" ? "Minor variation"
              : consistencyScore === "FAIR" ? "Noticeable variation"
              : "Erratic - review budget"
            }
            value={consistencyScore}
            status={consistencyStatus}
          />
        </div>
      </div>

      {/* Best / Worst month - subtle info strip */}
      {(bestSavingMonth || worstSpendingMonth) && (
        <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-muted-foreground">
          {bestSavingMonth && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-semibold text-[10px] uppercase tracking-wider">
                Best
              </span>
              <span className="text-foreground font-medium">{bestSavingMonth.monthName}</span>
              <span className="text-emerald-500 tabular-nums">+{formatCurrency(bestSavingMonth.net)}</span>
            </div>
          )}
          {bestSavingMonth && worstSpendingMonth && (
            <span className="hidden sm:inline text-border">|</span>
          )}
          {worstSpendingMonth && (
            <div className="flex items-center gap-2">
              <span className="text-rose-500 font-semibold text-[10px] uppercase tracking-wider">
                Peak
              </span>
              <span className="text-foreground font-medium">{worstSpendingMonth.monthName}</span>
              <span className="text-rose-500 tabular-nums">{formatCurrency(worstSpendingMonth.expense)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
