/**
 * AnnualSummaryCards — Server Component
 *
 * Menampilkan 4 kartu ringkasan finansial (Income, Expense, Net, Health).
 * Karena konten ini STATIS (tidak ada interaksi), ini berjalan di server
 * dan tidak mengirim JS ke klien — mengurangi TBT secara langsung.
 */

import { TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";
import { cn } from "@/lib/utils";

interface Props {
  totals: AnnualReportDTO["totals"];
  monthsCount: number;
}

export function AnnualSummaryCards({ totals, monthsCount }: Props) {
  const isDeficit = totals.expense > totals.income;

  const avgIncome = monthsCount > 0 ? totals.income / monthsCount : 0;
  const avgExpense = monthsCount > 0 ? totals.expense / monthsCount : 0;

  return (
    <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Income Card */}
      <div className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/20">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Total Income
              </p>
            </div>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(totals.income)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: <span className="font-medium text-foreground">{formatCurrency(avgIncome)}</span> / mo
            </p>
          </div>
        </div>
      </div>

      {/* Expense Card */}
      <div className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/20">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/10">
                <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Total Expense
              </p>
            </div>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(totals.expense)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Avg: <span className="font-medium text-foreground">{formatCurrency(avgExpense)}</span> / mo
              </p>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{totals.expenseRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net/Savings Card */}
      <div className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/20">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full",
                isDeficit ? "bg-rose-500/10" : "bg-emerald-500/10"
              )}>
                {isDeficit ? (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Net / Savings
              </p>
            </div>
          </div>
          <div>
            <p className={cn(
              "text-xl md:text-2xl font-bold tabular-nums",
              isDeficit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {formatCurrency(totals.net)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Of total income
              </p>
              <span className={cn(
                "text-xs font-medium",
                isDeficit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {Math.abs(totals.savingRate).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Card */}
      <div className={cn(
        "rounded-xl border p-4 transition-colors hover:bg-accent/20",
        isDeficit ? "border-rose-500/30 bg-rose-500/5" : "border-border/60 bg-card"
      )}>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Health Status
              </p>
            </div>
          </div>
          <div>
            <p className={cn(
              "text-xl md:text-2xl font-bold uppercase tracking-tight",
              isDeficit ? "text-rose-600 dark:text-rose-400" : "text-foreground"
            )}>
              {isDeficit ? "Deficit" : "Surplus"}
            </p>
            
            {/* Health Bar */}
            <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
              <div 
                className="bg-rose-500 h-full" 
                style={{ width: `${Math.min(totals.expenseRate, 100)}%` }} 
              />
              {!isDeficit && (
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${Math.min(totals.savingRate, 100)}%` }} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
