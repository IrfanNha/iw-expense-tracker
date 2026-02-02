"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Tag } from "lucide-react";
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
  const getStatusBadge = () => {
    if (overBudget) {
      return (
        <Badge variant="destructive" className="text-xs">
          Over Budget
        </Badge>
      );
    }
    if (usageRate >= 80) {
      return (
        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-500">
          Near Limit
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-500">
        On Track
      </Badge>
    );
  };

  const getProgressColor = () => {
    if (overBudget) return "bg-red-500";
    if (usageRate >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get icon component
  const IconComponent = (categoryIcon && Icons[categoryIcon as keyof typeof Icons]
    ? Icons[categoryIcon as keyof typeof Icons]
    : Tag) as unknown as React.ComponentType<{ className?: string }>;

  return (
    <Card className="shadow-none border rounded-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Category Icon & Info */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <IconComponent className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-semibold truncate">
                  {categoryName}
                </h3>
                {getStatusBadge()}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                <div>
                  <span className="text-muted-foreground">Budget: </span>
                  <span className="font-medium">{formatBudgetAmount(budgetAmount)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Spent: </span>
                  <span className={cn(
                    "font-medium",
                    overBudget ? "text-red-600" : ""
                  )}>
                    {formatBudgetAmount(actualAmount)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {overBudget ? "Over by" : "Remaining"}: {formatBudgetAmount(Math.abs(remainingAmount))}
                  </span>
                  <span className={cn(
                    "font-medium",
                    overBudget ? "text-red-600" : usageRate >= 80 ? "text-yellow-600" : "text-green-600"
                  )}>
                    {usageRate.toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                  <div
                    className={`h-full transition-all ${getProgressColor()}`}
                    style={{ width: `${Math.min(usageRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8"
              onClick={() => onEdit(id)}
              title="Edit budget"
            >
              <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(id)}
              title="Delete budget"
            >
              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
