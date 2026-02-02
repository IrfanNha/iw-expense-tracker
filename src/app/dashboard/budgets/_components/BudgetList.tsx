"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

export function BudgetList({
  budgets,
  isLoading,
  onEdit,
  onDelete,
  onCreateBudget,
}: BudgetListProps) {
  if (isLoading) {
    return (
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm md:text-lg font-semibold">Category Budgets</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Track spending by category
            </p>
          </div>
          <Button onClick={onCreateBudget} size="sm" className="h-8 md:h-9">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Budget</span>
          </Button>
        </div>
        <div className="space-y-2 md:space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-none">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <Skeleton className="h-8 w-16 ml-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm md:text-lg font-semibold">Category Budgets</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Track spending by category
            </p>
          </div>
          <Button onClick={onCreateBudget} size="sm" className="h-8 md:h-9">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Budget</span>
          </Button>
        </div>
        <div className="text-center py-8 md:py-12">
          <div className="mx-auto h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted flex items-center justify-center mb-3 md:mb-4">
            <Plus className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
          </div>
          <p className="text-sm md:text-base text-muted-foreground mb-2">
            No budgets set
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            Create your first budget to start tracking your spending against
            financial goals
          </p>
          <Button onClick={onCreateBudget} className="h-8 md:h-9">
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm md:text-lg font-semibold">Category Budgets</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {budgets.length} {budgets.length === 1 ? "budget" : "budgets"} set for this month
          </p>
        </div>
        <Button onClick={onCreateBudget} size="sm" className="h-8 md:h-9">
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Add Budget</span>
        </Button>
      </div>
      <div className="space-y-2 md:space-y-3">
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
