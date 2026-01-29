"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/money";
import { PercentageMode, PERCENTAGE_MODE_HELPER_TEXT } from "@/types/finance";

// Dynamic import for the entire chart component
const ChartContent = dynamic(
  () => import("recharts").then((recharts) => {
    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = recharts;
    
    return function ChartContentComponent({ 
      data
    }: { 
      data: Array<{ name: string; value: number; color: string }>;
    }) {
      if (data.length === 0) return null;

      return (
        <div className="w-full" style={{ height: "clamp(120px, 18vw, 160px)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="60%"
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    };
  }),
  { 
    ssr: false,
    loading: () => <div className="text-center py-8 text-muted-foreground text-xs">Loading chart...</div>
  }
);

interface IncomeExpenseChartProps {
  income: number;
  expense: number;
  mode: PercentageMode;
}

export function IncomeExpenseChart({ income, expense, mode }: IncomeExpenseChartProps) {
  const net = income - expense;
  const isDeficit = expense > income;

  // MODE A: Income-based (Expense vs Savings)
  if (mode === PercentageMode.INCOME_BASED) {
    // Edge case: No income data - cannot calculate percentages
    if (income === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-xs">
          No income data - percentages cannot be calculated
        </div>
      );
    }

    // Calculate percentages based on income as the 100% baseline
    const expensePercentage = ((expense / income) * 100).toFixed(1);
    const netPercentage = ((net / income) * 100).toFixed(1);

    // Chart data: Shows how income is allocated
    const chartData = [
      { name: "Expense", value: expense, color: "#ef4444" },
      { name: "Savings", value: net > 0 ? net : 0, color: "#22c55e" },
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-600 shrink-0" />
              <span className="text-muted-foreground">Expense</span>
              <span className={`font-semibold ${isDeficit ? 'text-red-600' : ''}`}>
                {expensePercentage}%
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-600 shrink-0" />
              <span className="text-muted-foreground">Saved</span>
              <span className={`font-semibold ${isDeficit ? 'text-red-600' : 'text-green-600'}`}>
                {netPercentage}%
              </span>
            </div>
          </div>
          {/* Helper text explaining the percentage basis */}
          <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 mt-1">
            {PERCENTAGE_MODE_HELPER_TEXT[PercentageMode.INCOME_BASED]}
          </p>
        </div>
        
        {/* Chart showing allocation of income */}
        <ChartContent data={chartData} />
        
        <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Income</span>
            <span className="font-semibold text-green-600">{formatCurrency(income)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Expense</span>
            <span className="font-semibold text-red-600">{formatCurrency(expense)}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t">
            <div className="flex items-center gap-1">
              <span className="font-medium">Net / Savings</span>
              {isDeficit && (
                <span className="text-[9px] text-red-600 font-medium">(Deficit)</span>
              )}
            </div>
            <span className={`font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // MODE B: Cash Flow Proportion (Income vs Expense proportion)
  if (mode === PercentageMode.CASH_FLOW_PROPORTION) {
    const totalCashFlow = income + expense;

    // Edge case: No transactions at all
    if (totalCashFlow === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-xs">
          No data available
        </div>
      );
    }

    // Calculate proportions of total cash flow
    const incomePercentage = ((income / totalCashFlow) * 100).toFixed(1);
    const expensePercentage = ((expense / totalCashFlow) * 100).toFixed(1);

    // Chart data: Shows proportion of cash flow
    const chartData = [
      { name: "Income", value: income, color: "#22c55e" },
      { name: "Expense", value: expense, color: "#ef4444" },
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-600 shrink-0" />
              <span className="text-muted-foreground">Income</span>
              <span className="font-semibold text-green-600">
                {incomePercentage}%
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-600 shrink-0" />
              <span className="text-muted-foreground">Expense</span>
              <span className="font-semibold text-red-600">
                {expensePercentage}%
              </span>
            </div>
          </div>
          {/* Helper text explaining this is descriptive only */}
          <p className="text-[9px] sm:text-[10px] text-amber-600/80 mt-1">
            {PERCENTAGE_MODE_HELPER_TEXT[PercentageMode.CASH_FLOW_PROPORTION]}
          </p>
        </div>
        
        {/* Chart showing cash flow proportion */}
        <ChartContent data={chartData} />
        
        <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Income</span>
            <span className="font-semibold text-green-600">{formatCurrency(income)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Expense</span>
            <span className="font-semibold text-red-600">{formatCurrency(expense)}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t">
            <div className="flex items-center gap-1">
              <span className="font-medium">Net / Savings</span>
              {isDeficit && (
                <span className="text-[9px] text-red-600 font-medium">(Deficit)</span>
              )}
            </div>
            <span className={`font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should never reach here)
  return null;
}
