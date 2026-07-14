"use client";

import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/money";
import { PercentageMode, PERCENTAGE_MODE_HELPER_TEXT } from "@/types/finance";

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Reusable stats row used in both Mode A and Mode B */
function StatsRow({
  income,
  expense,
  net,
  isDeficit,
}: {
  income: number;
  expense: number;
  net: number;
  isDeficit: boolean;
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Total Income</span>
        <span className="font-semibold text-green-500">{formatCurrency(income)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Total Expense</span>
        <span className="font-semibold text-red-500">{formatCurrency(expense)}</span>
      </div>
      <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">Net / Savings</span>
          {isDeficit && (
            <span className="text-[9px] sm:text-[10px] text-red-500 font-medium bg-red-500/10 px-1.5 py-0.5 rounded-full">
              Deficit
            </span>
          )}
        </div>
        <span className={`font-bold ${net >= 0 ? "text-green-500" : "text-red-500"}`}>
          {net >= 0 ? "+" : ""}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
}

// ─── Dynamic chart with center label overlay ──────────────────────────────────

const ChartContent = dynamic(
  () => import("recharts").then((recharts) => {
    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = recharts;

    return function ChartContentComponent({
      data,
      centerLabel,
      centerSublabel,
      centerColor,
    }: {
      data: Array<{ name: string; value: number; color: string }>;
      centerLabel: string;
      centerSublabel: string;
      centerColor: string;
    }) {
      if (data.length === 0) return null;

      return (
        <div className="relative w-full" style={{ height: "clamp(150px, 22vw, 200px)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="42%"
                outerRadius="65%"
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="text-sm sm:text-base md:text-lg font-bold leading-none"
              style={{ color: centerColor }}
            >
              {centerLabel}
            </span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 leading-none">
              {centerSublabel}
            </span>
          </div>
        </div>
      );
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full flex items-center justify-center" style={{ height: "clamp(150px, 22vw, 200px)" }}>
        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-muted animate-pulse" />
      </div>
    ),
  }
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface IncomeExpenseChartProps {
  income: number;
  expense: number;
  mode: PercentageMode;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IncomeExpenseChart({ income, expense, mode }: IncomeExpenseChartProps) {
  const net = income - expense;
  const isDeficit = expense > income;

  // ── MODE A: Income-based (Expense vs Savings) ────────────────────────────
  if (mode === PercentageMode.INCOME_BASED) {
    if (income === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No income data</p>
          <p className="text-xs text-muted-foreground">Add income to calculate savings rate</p>
        </div>
      );
    }

    const expensePercentage = ((expense / income) * 100).toFixed(1);
    const netPercentage = ((net / income) * 100).toFixed(1);

    const chartData = [
      { name: "Expense", value: expense, color: "#ef4444" },
      { name: "Savings", value: net > 0 ? net : 0, color: "#22c55e" },
    ].filter((item) => item.value > 0);

    // Center label: savings rate
    const savingsRate = parseFloat(netPercentage);
    const centerLabel = `${savingsRate >= 0 ? "" : ""}${netPercentage}%`;
    const centerSublabel = isDeficit ? "deficit" : "saved";
    const centerColor = isDeficit ? "#ef4444" : "#22c55e";

    return (
      <div className="space-y-3 sm:space-y-4">
        {/* Legend pills — compact, centered */}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Expense</span>
            <span className="text-[10px] sm:text-xs font-semibold text-red-500">{expensePercentage}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Saved</span>
            <span className={`text-[10px] sm:text-xs font-semibold ${isDeficit ? "text-red-500" : "text-green-500"}`}>
              {netPercentage}%
            </span>
          </div>
          {/* Subtle helper tooltip-style label */}
          <span className="text-[9px] text-muted-foreground/50 hidden sm:inline">
            {PERCENTAGE_MODE_HELPER_TEXT[PercentageMode.INCOME_BASED]}
          </span>
        </div>

        <ChartContent
          data={chartData}
          centerLabel={centerLabel}
          centerSublabel={centerSublabel}
          centerColor={centerColor}
        />

        <StatsRow income={income} expense={expense} net={net} isDeficit={isDeficit} />
      </div>
    );
  }

  // ── MODE B: Cash Flow Proportion ─────────────────────────────────────────
  if (mode === PercentageMode.CASH_FLOW_PROPORTION) {
    const totalCashFlow = income + expense;

    if (totalCashFlow === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No data yet</p>
          <p className="text-xs text-muted-foreground">Add a transaction to see the summary</p>
        </div>
      );
    }

    const incomePercentage = ((income / totalCashFlow) * 100).toFixed(1);
    const expensePercentage = ((expense / totalCashFlow) * 100).toFixed(1);

    const chartData = [
      { name: "Income", value: income, color: "#22c55e" },
      { name: "Expense", value: expense, color: "#ef4444" },
    ].filter((item) => item.value > 0);

    // Center label: dominant side
    const dominantPct = income >= expense ? incomePercentage : expensePercentage;
    const centerLabel = `${dominantPct}%`;
    const centerSublabel = income >= expense ? "income" : "expense";
    const centerColor = income >= expense ? "#22c55e" : "#ef4444";

    return (
      <div className="space-y-3 sm:space-y-4">
        {/* Legend pills */}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Income</span>
            <span className="text-[10px] sm:text-xs font-semibold text-green-500">{incomePercentage}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Expense</span>
            <span className="text-[10px] sm:text-xs font-semibold text-red-500">{expensePercentage}%</span>
          </div>
        </div>

        <ChartContent
          data={chartData}
          centerLabel={centerLabel}
          centerSublabel={centerSublabel}
          centerColor={centerColor}
        />

        {/* Subtle helper note */}
        <p className="text-[9px] text-center text-muted-foreground/50">
          {PERCENTAGE_MODE_HELPER_TEXT[PercentageMode.CASH_FLOW_PROPORTION]}
        </p>

        <StatsRow income={income} expense={expense} net={net} isDeficit={isDeficit} />
      </div>
    );
  }

  return null;
}
