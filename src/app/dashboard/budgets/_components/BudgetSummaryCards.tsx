"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, TrendingUpIcon } from "lucide-react";
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
    <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
      {/* Total Budget */}
      <Card className="shadow-none border rounded-sm">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Budget
            </p>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold">
              {formatBudgetAmount(totalBudget)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly limit
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card className="shadow-none border rounded-sm">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Spent
            </p>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              isOverBudget ? "text-red-600" : ""
            )}>
              {formatBudgetAmount(totalActual)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Current spending
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card className="shadow-none border rounded-sm">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              {isOverBudget ? "Over Budget" : "Remaining"}
            </p>
            <TrendingUp className={cn(
              "h-4 w-4",
              isOverBudget 
                ? "text-red-600" 
                : isNearLimit 
                ? "text-yellow-600"
                : "text-green-600"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              isOverBudget 
                ? "text-red-600" 
                : isNearLimit 
                ? "text-yellow-600"
                : "text-green-600"
            )}>
              {formatBudgetAmount(Math.abs(totalRemaining))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isOverBudget ? "Exceeded limit" : "Available to spend"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Rate */}
      <Card className="shadow-none border rounded-sm">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Usage Rate
            </p>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              isOverBudget 
                ? "text-red-600" 
                : isNearLimit 
                ? "text-yellow-600"
                : "text-green-600"
            )}>
              {overallUsageRate.toFixed(1)}%
            </p>
            <p className={cn(
              "text-xs mt-1 font-medium",
              isOverBudget 
                ? "text-red-600" 
                : isNearLimit 
                ? "text-yellow-600"
                : "text-green-600"
            )}>
              {isOverBudget 
                ? "Over budget" 
                : isNearLimit 
                ? "Near limit"
                : "On track"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
