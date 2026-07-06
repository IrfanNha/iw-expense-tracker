"use client";

/**
 * BalanceHeader
 *
 * Displays total wallet balance and the monthly income/expense/net summary strip.
 * Design: clean, typography-first, no gradients — consistent with modern fintech apps.
 */
import * as React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function BalanceSkeleton() {
  return (
    <div className="p-4 md:p-6 bg-background border-b border-border/60 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-9 w-44 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="h-9 w-9 rounded-full bg-muted" />
      </div>
      <div className="mt-4 rounded-lg border bg-card p-4">
        <div className="flex justify-between gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-5 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Summary metric ───────────────────────────────────────────────────────────

interface MetricProps {
  label: string;
  value: string;
  valueClass: string;
  icon: React.ReactNode;
  loading: boolean;
}

const SummaryMetric = React.memo(function SummaryMetric({
  label,
  value,
  valueClass,
  icon,
  loading,
}: MetricProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={cn("text-sm md:text-base lg:text-lg font-semibold tabular-nums", valueClass)}>
        {loading ? (
          <span className="inline-block h-4 w-20 animate-pulse rounded bg-muted" />
        ) : (
          value
        )}
      </span>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

interface BalanceHeaderProps {
  totalBalance: number;
  income: number;
  expense: number;
  net: number;
  reportLoading: boolean;
  accountsLoading: boolean;
}

export const BalanceHeader = React.memo(function BalanceHeader({
  totalBalance,
  income,
  expense,
  net,
  reportLoading,
  accountsLoading,
}: BalanceHeaderProps) {
  return (
    <div className="bg-background border-b border-border/60 pb-5 md:pb-6">
      {/* Balance row */}
      <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-5">
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            Total Balance
          </p>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums">
            {accountsLoading ? (
              <span className="inline-block h-9 w-48 animate-pulse rounded bg-muted" />
            ) : (
              formatCurrency(totalBalance)
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Across all accounts</p>
        </div>

        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 shrink-0 rounded-full mt-1"
          asChild
          title="Transfer"
        >
          <Link href="/dashboard/transfer">
            <ArrowLeftRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Summary strip */}
      <div className="mx-4 md:mx-6 rounded-xl border border-border/60 bg-card">
        <div className="grid grid-cols-3 divide-x divide-border/60 px-2 py-3  md:px-4 md:py-4">
          <div className="px-2 md:px-3">
            <SummaryMetric
              label="Income"
              value={formatCurrency(income)}
              valueClass="text-emerald-600 dark:text-emerald-400"
              icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
              loading={reportLoading}
            />
          </div>
          <div className="px-2 md:px-3">
            <SummaryMetric
              label="Expense"
              value={formatCurrency(expense)}
              valueClass="text-rose-600 dark:text-rose-400"
              icon={<TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
              loading={reportLoading}
            />
          </div>
          <div className="px-2 md:px-3">
            <SummaryMetric
              label="Net"
              value={formatCurrency(net)}
              valueClass={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
              icon={<ArrowLeftRight className="h-3.5 w-3.5 text-sky-500" />}
              loading={reportLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
