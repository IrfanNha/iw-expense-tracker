"use client";

/**
 * MonthlyCategoryBrowser — Client Component
 *
 * Interactive month selector + category breakdown.
 *
 * PERFORMANCE:
 * - All data is passed as props (pre-fetched server-side, zero extra requests)
 * - Client-side filtering only — no network calls on month change
 * - useMemo guards against unnecessary re-derivations
 *
 * SECURITY:
 * - Receives only the DTO shape — no raw DB models
 * - categoryId used only as React key (user's own data)
 */

import * as React from "react";
import { TrendingDown, TrendingUp, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import { CHART_COLORS } from "@/lib/colors";
import type { MonthCategoryBreakdown } from "@/lib/report/annual-report";

const MONTH_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

type FilterType = "all" | "expense" | "income";

interface Props {
  breakdown: MonthCategoryBreakdown[];
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterType }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Receipt className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">No data</p>
      <p className="text-xs text-muted-foreground">
        {filter === "all"
          ? "No transactions recorded this month"
          : `No ${filter} transactions this month`}
      </p>
    </div>
  );
}

// ─── Category Row ─────────────────────────────────────────────────────────────

function CategoryRow({
  name,
  amount,
  percentage,
  type,
  colorIndex,
}: {
  name: string;
  amount: number;
  percentage: number;
  type: "INCOME" | "EXPENSE";
  colorIndex: number;
}) {
  const color = CHART_COLORS[colorIndex % CHART_COLORS.length];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm truncate">{name}</span>
          {type === "INCOME" ? (
            <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 text-rose-500 shrink-0" />
          )}
        </div>
        <span className="text-sm font-semibold tabular-nums shrink-0">
          {formatCurrency(amount)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right tabular-nums">
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MonthlyCategoryBrowser({ breakdown }: Props) {
  const defaultMonth = React.useMemo(() => {
    // Default to the first month that has data; fallback to first in range
    const first = breakdown.find((b) => b.categories.length > 0);
    return first?.month ?? breakdown[0]?.month ?? 1;
  }, [breakdown]);

  const [selectedMonth, setSelectedMonth] = React.useState<number>(defaultMonth);
  const [filter, setFilter] = React.useState<FilterType>("expense");

  // Build a fast lookup: month → data
  const byMonth = React.useMemo(() => {
    const map = new Map<number, MonthCategoryBreakdown>();
    breakdown.forEach((b) => map.set(b.month, b));
    return map;
  }, [breakdown]);

  // Months that have at least one category entry
  const monthsWithData = React.useMemo(
    () => new Set(breakdown.filter((b) => b.categories.length > 0).map((b) => b.month)),
    [breakdown],
  );

  const active = byMonth.get(selectedMonth);

  const filteredCategories = React.useMemo(() => {
    if (!active) return [];
    if (filter === "all") return active.categories;
    const type = filter === "income" ? "INCOME" : "EXPENSE";
    return active.categories.filter((c) => c.type === type);
  }, [active, filter]);

  if (!breakdown.length) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6">
        <div className="mb-5">
          <h2 className="text-base md:text-lg font-semibold">Monthly Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Category spending by month</p>
        </div>
        <EmptyState filter="all" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6 transition-colors hover:bg-accent/5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base md:text-lg font-semibold">Monthly Breakdown</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Category spending by month - select a month to explore
        </p>
      </div>

      {/* Month pill selector — scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {breakdown.map((b) => {
          const hasData = monthsWithData.has(b.month);
          const isActive = b.month === selectedMonth;
          return (
            <button
              key={b.month}
              onClick={() => setSelectedMonth(b.month)}
              className={cn(
                "shrink-0 h-8 px-3 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : hasData
                  ? "bg-muted/60 text-foreground hover:bg-muted"
                  : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50",
              )}
            >
              {MONTH_SHORT[b.month - 1]}
              {!hasData && <span className="ml-0.5 opacity-40">·</span>}
            </button>
          );
        })}
      </div>

      {/* Active month summary strip - flex-wrap to avoid overflow */}
      {active && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 px-0.5 text-xs">
          <span className="font-semibold text-foreground text-sm">{active.monthName}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="tabular-nums">{formatCurrency(active.totalIncome)}</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingDown className="h-3 w-3 text-rose-500" />
            <span className="tabular-nums">{formatCurrency(active.totalExpense)}</span>
          </span>
          <span className={cn(
            "font-medium tabular-nums ml-auto",
            active.totalIncome >= active.totalExpense ? "text-emerald-500" : "text-rose-500"
          )}>
            {active.totalIncome >= active.totalExpense ? "+" : ""}
            {formatCurrency(active.totalIncome - active.totalExpense)}
          </span>
        </div>
      )}

      {/* Type filter tabs */}
      <div className="flex gap-1 bg-muted/60 p-1 rounded-lg mb-4 w-fit">
        {(["expense", "income", "all"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "h-7 px-3 rounded-md text-xs font-medium transition-all capitalize",
              filter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all" ? "All" : f === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      {/* Category list */}
      {filteredCategories.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((cat, idx) => (
            <CategoryRow
              key={`${cat.categoryId}-${cat.type}`}
              name={cat.categoryName}
              amount={cat.amount}
              percentage={cat.percentage}
              type={cat.type}
              colorIndex={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
