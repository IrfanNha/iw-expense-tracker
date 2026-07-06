"use client";

import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// Budget amounts are stored as full rupiah (not cents)
const formatBudgetAmount = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
};

interface BudgetSummaryCardsProps {
  totalBudget: number;
  totalActual: number;
  totalRemaining: number;
  overallUsageRate: number;
}

export function BudgetSummaryCards({
  totalBudget,
  totalActual,
  totalRemaining,
  overallUsageRate,
}: BudgetSummaryCardsProps) {
  const isOverBudget = totalRemaining < 0;
  const isNearLimit = overallUsageRate >= 80 && !isOverBudget;

  return (
    <div className="mx-4 md:mx-6 rounded-xl border border-border/60 bg-card">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
        
        {/* Total Budget */}
        <div className="px-3 py-3 md:px-4 md:py-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                <Wallet className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
                Total Budget
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-sm md:text-xl font-bold tabular-nums text-foreground">
                {formatBudgetAmount(totalBudget)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="px-3 py-3 md:px-4 md:py-4 border-l border-border/60 md:border-l-0">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-red-500/10 shrink-0">
                <TrendingDown className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
                Total Spent
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className={cn(
                "text-sm md:text-xl font-bold tabular-nums text-foreground",
                isOverBudget ? "text-red-600 dark:text-red-400" : ""
              )}>
                {formatBudgetAmount(totalActual)}
              </p>
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="px-3 py-3 md:px-4 md:py-4 border-t border-border/60 md:border-t-0">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className={cn(
                "flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full shrink-0",
                isOverBudget ? "bg-red-500/10" : isNearLimit ? "bg-amber-500/10" : "bg-emerald-500/10"
              )}>
                <TrendingUp className={cn(
                  "h-3 w-3 md:h-3.5 md:w-3.5",
                  isOverBudget ? "text-red-600 dark:text-red-400" : isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                )} />
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
                {isOverBudget ? "Over Budget" : "Remaining"}
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className={cn(
                "text-sm md:text-xl font-bold tabular-nums",
                isOverBudget ? "text-red-600 dark:text-red-400" : isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {formatBudgetAmount(Math.abs(totalRemaining))}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Rate */}
        <div className="px-3 py-3 md:px-4 md:py-4 border-l border-border/60 md:border-l-0">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-violet-500/10 shrink-0">
                <Target className="h-3 w-3 md:h-3.5 md:w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
                Usage Rate
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className={cn(
                "text-sm md:text-xl font-bold tabular-nums",
                isOverBudget ? "text-red-600 dark:text-red-400" : isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {overallUsageRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
