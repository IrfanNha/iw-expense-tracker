"use client";

/**
 * GroupedTransactionItem
 *
 * Single row in the grouped-by-category view.
 * Shows icon, category label, count, and signed total.
 */
import * as React from "react";
import * as Icons from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import type { GroupedCategory } from "@/hooks/usePeriodTransactions";

interface GroupedTransactionItemProps {
  groupKey: string;
  group: GroupedCategory;
}

export const GroupedTransactionItem = React.memo(function GroupedTransactionItem({
  groupKey,
  group,
}: GroupedTransactionItemProps) {
  const isPositive = group.total >= 0;

  const IconComponent = (
    group.items[0]?.category?.icon &&
    Icons[group.items[0].category.icon as keyof typeof Icons]
      ? Icons[group.items[0].category.icon as keyof typeof Icons]
      : group.isIncome
      ? TrendingUp
      : TrendingDown
  ) as unknown as React.ComponentType<{ className?: string }>;

  return (
    <div
      key={groupKey}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:bg-accent/30"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            group.isIncome
              ? "bg-emerald-500/10 dark:bg-emerald-500/15"
              : "bg-rose-500/10 dark:bg-rose-500/15"
          )}
        >
          <IconComponent
            className={cn(
              "h-5 w-5",
              group.isIncome
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">{group.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {group.items.length} transaction{group.items.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <p
        className={cn(
          "text-sm md:text-base font-bold tabular-nums shrink-0",
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        )}
      >
        {group.total > 0 ? "+" : "–"}
        {formatCurrency(Math.abs(group.total))}
      </p>
    </div>
  );
});
