"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
import { BudgetCategoryRow } from "./BudgetCategoryRow";

interface BudgetVsActual {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  actualAmount: number;
  remainingAmount: number;
  usageRate: number;
  overBudget: boolean;
}

interface BudgetListProps {
  budgets: BudgetVsActual[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateBudget: () => void;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BudgetSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-lg bg-muted" />
          <div className="h-7 w-7 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="pt-3 border-t border-border/60 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyBudgetState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Target className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">No budgets set</p>
      <p className="text-xs text-muted-foreground mb-5 max-w-[260px]">
        Create your first budget to start tracking your spending against financial goals
      </p>
      <Button size="sm" className="rounded-lg gap-2" onClick={onCreateClick}>
        <Plus className="h-3.5 w-3.5" />
        Create Budget
      </Button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BudgetList({
  budgets,
  isLoading,
  onEdit,
  onDelete,
  onCreateBudget,
}: BudgetListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm md:text-base font-semibold">Category Budgets</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track spending by category</p>
          </div>
          <Button onClick={onCreateBudget} size="sm" className="rounded-lg gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Budget</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BudgetSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm md:text-base font-semibold">Category Budgets</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track spending by category</p>
          </div>
        </div>
        <EmptyBudgetState onCreateClick={onCreateBudget} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm md:text-base font-semibold">Category Budgets</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {budgets.length} {budgets.length === 1 ? "budget" : "budgets"} set for this month
          </p>
        </div>
        <Button onClick={onCreateBudget} size="sm" className="rounded-lg gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Budget</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
      
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCategoryRow
            key={budget.id}
            id={budget.id}
            categoryName={budget.categoryName}
            categoryIcon={budget.categoryIcon}
            budgetAmount={budget.budgetAmount}
            actualAmount={budget.actualAmount}
            remainingAmount={budget.remainingAmount}
            usageRate={budget.usageRate}
            overBudget={budget.overBudget}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
