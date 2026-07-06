"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Tag } from "lucide-react";
import * as Icons from "lucide-react";
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

interface BudgetCategoryRowProps {
  id: string;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  actualAmount: number;
  remainingAmount: number;
  usageRate: number;
  overBudget: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BudgetCategoryRow({
  id,
  categoryName,
  categoryIcon,
  budgetAmount,
  actualAmount,
  remainingAmount,
  usageRate,
  overBudget,
  onEdit,
  onDelete,
}: BudgetCategoryRowProps) {
  const getStatusText = () => {
    if (overBudget) return "Over Budget";
    if (usageRate >= 80) return "Near Limit";
    return "On Track";
  };

  const getStatusColor = () => {
    if (overBudget) return "text-red-600 dark:text-red-400";
    if (usageRate >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getProgressColor = () => {
    if (overBudget) return "bg-red-500";
    if (usageRate >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Get icon component
  const IconComponent = (
    categoryIcon && Icons[categoryIcon as keyof typeof Icons]
      ? Icons[categoryIcon as keyof typeof Icons]
      : Tag
  ) as unknown as React.ComponentType<{ className?: string }>;

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/20 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate leading-tight">
                {categoryName}
              </h3>
            </div>
            <p className={cn("text-xs font-medium mt-0.5 uppercase tracking-wider", getStatusColor())}>
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Action Buttons — Hover reveal on desktop */}
        <div className="flex gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(id)}
            title="Edit budget"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(id)}
            title="Delete budget"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Budget</span>
            <span className="font-bold tabular-nums">{formatBudgetAmount(budgetAmount)}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Spent</span>
            <span className={cn(
              "font-bold tabular-nums",
              overBudget ? "text-red-600 dark:text-red-400" : ""
            )}>
              {formatBudgetAmount(actualAmount)}
            </span>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {overBudget ? "Over by" : "Remaining"}: <span className="font-medium text-foreground">{formatBudgetAmount(Math.abs(remainingAmount))}</span>
            </span>
            <span className={cn(
              "font-bold tabular-nums",
              getStatusColor()
            )}>
              {usageRate.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(usageRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
