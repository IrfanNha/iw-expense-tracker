/**
 * AnnualSummaryCards — Server Component
 *
 * Single-card executive summary. Professional, mature layout consistent
 * with AnnualRatiosSection and AnnualInsightsPanel.
 * Zero JS shipped to the client.
 */

import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";
import { cn } from "@/lib/utils";

interface Props {
  totals: AnnualReportDTO["totals"];
  monthsCount: number;
}

export function AnnualSummaryCards({ totals, monthsCount }: Props) {
  const isDeficit = totals.expense > totals.income;
  const avgIncome  = monthsCount > 0 ? totals.income  / monthsCount : 0;
  const avgExpense = monthsCount > 0 ? totals.expense / monthsCount : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6">

      {/* ── Three key metrics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3">

        {/* Income */}
        <div className="pb-5 sm:pb-0 sm:pr-6 border-b sm:border-b-0 sm:border-r border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
            Total Income
          </p>
          <p className="text-2xl md:text-3xl font-bold tabular-nums text-foreground leading-none">
            {formatCurrency(totals.income)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Avg{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(avgIncome)}
            </span>{" "}
            / mo
          </p>
        </div>

        {/* Expense */}
        <div className="py-5 sm:py-0 sm:px-6 border-b sm:border-b-0 sm:border-r border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
            Total Expense
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-bold tabular-nums text-rose-500 leading-none">
              {formatCurrency(totals.expense)}
            </p>
            <span className="text-xs font-semibold text-rose-500 tabular-nums">
              {totals.expenseRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Avg{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(avgExpense)}
            </span>{" "}
            / mo
          </p>
        </div>

        {/* Net / Savings */}
        <div className="pt-5 sm:pt-0 sm:pl-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
            Net / Savings
          </p>
          <div className="flex items-baseline gap-2">
            <p className={cn(
              "text-2xl md:text-3xl font-bold tabular-nums leading-none",
              isDeficit ? "text-rose-500" : "text-emerald-500",
            )}>
              {formatCurrency(totals.net)}
            </p>
            <span className={cn(
              "text-xs font-semibold tabular-nums",
              isDeficit ? "text-rose-500" : "text-emerald-500",
            )}>
              {Math.abs(totals.savingRate).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">of total income</p>
        </div>
      </div>

      {/* ── Health Status bar ─────────────────────────────────────────────── */}
      <div className="mt-5 pt-5 border-t border-border/40">
        {/* Label row */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest",
              isDeficit ? "text-rose-500" : "text-foreground",
            )}>
              {isDeficit ? "Deficit" : "Surplus"}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              Health Status
            </span>
          </div>

          {/* Legend — right-aligned */}
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
              Expense {totals.expenseRate.toFixed(1)}%
            </span>
            {!isDeficit && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Savings {totals.savingRate.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Bar */}
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(totals.expenseRate, 100)}%` }}
          />
          {!isDeficit && (
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(totals.savingRate, 100)}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
