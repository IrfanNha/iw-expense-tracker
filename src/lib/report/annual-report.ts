/**
 * Annual Report Data Access Layer
 *
 * SECURITY RULES:
 * 1. `userId` ALWAYS sourced from server session — never from client input
 * 2. NEVER query Transaction table directly for reports
 * 3. Use ONLY pre-aggregated tables: MonthlySummary, MonthlyCategorySummary
 * 4. DTO shape exposes only what the UI needs — no internal DB metadata
 * 5. All computation server-side — client receives final, safe DTO
 *
 * CACHING:
 * - React `cache()` deduplicates identical calls within a single server render
 * - No redundant DB roundtrips if getAnnualReport is called multiple times
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ensureMonthlySummariesForRange } from "@/lib/summary/ensure-monthly-summary";

// ─── DTO ──────────────────────────────────────────────────────────────────────

export type MonthCategoryEntry = {
  /** Stable key for React list rendering (user's own data — safe to expose) */
  categoryId: string;
  categoryName: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  /** % relative to month's total for the same type */
  percentage: number;
};

export type MonthCategoryBreakdown = {
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  categories: MonthCategoryEntry[];
};

export type AnnualRatios = {
  /** % of income saved: (net / income) × 100 */
  savingsRate: number;
  /** % of income spent: (expense / income) × 100 */
  expenseRatio: number;
  /** Average monthly income over the period */
  avgMonthlyIncome: number;
  /** Average monthly expense over the period */
  avgMonthlyExpense: number;
  /**
   * How many months the cumulative net surplus could sustain avg spending.
   * null when net ≤ 0 (deficit).
   */
  monthsOfSurplus: number | null;
  /** Count of months where net < 0 */
  deficitMonthsCount: number;
  /** Month with highest net savings */
  bestSavingMonth: { month: number; monthName: string; net: number } | null;
  /** Month with highest expense */
  worstSpendingMonth: { month: number; monthName: string; expense: number } | null;
  /** Derived from expense volatility coefficient of variation */
  consistencyScore: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
};

export type AnnualReportDTO = {
  year: number;
  range: {
    fromMonth: number;
    toMonth: number;
  };

  /** Core financial metrics */
  totals: {
    income: number;
    expense: number;
    net: number;
    expenseRate: number;
    savingRate: number;
  };

  /** Month-by-month breakdown for trend chart */
  monthlyTrend: Array<{
    month: number;
    monthName: string;
    income: number;
    expense: number;
    net: number;
  }>;

  /** Annual top expense categories (aggregated across all months) */
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentageOfExpense: number;
  }>;

  /** Per-month category breakdown for the Monthly Category Browser */
  monthlyCategoryBreakdown: MonthCategoryBreakdown[];

  /** Derived financial ratios for the Ratios section */
  ratios: AnnualRatios;

  /** Actionable insights */
  insights: {
    highestExpenseMonth: number | null;
    lowestSavingMonth: number | null;
    expenseVolatility: "LOW" | "MEDIUM" | "HIGH";
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function calculateVolatility(expenses: number[]): "LOW" | "MEDIUM" | "HIGH" {
  if (expenses.length < 2) return "LOW";
  const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
  const variance = expenses.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / expenses.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  if (cv < 0.15) return "LOW";
  if (cv < 0.30) return "MEDIUM";
  return "HIGH";
}

function volatilityToConsistency(v: "LOW" | "MEDIUM" | "HIGH"): AnnualRatios["consistencyScore"] {
  if (v === "LOW") return "EXCELLENT";
  if (v === "MEDIUM") return "GOOD";
  return "POOR";
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Get Annual Financial Report
 *
 * SECURITY: userId must be validated from server session before calling.
 * This function is not exported as an API route — server-only.
 *
 * cache() deduplicates calls within a single server render cycle.
 */
export const getAnnualReport = cache(async function getAnnualReport(
  userId: string,
  year: number,
  fromMonth: number = 1,
  toMonth: number = 12,
): Promise<AnnualReportDTO> {
  // Clamp and validate month range server-side
  const validFromMonth = Math.max(1, Math.min(12, fromMonth));
  const validToMonth = Math.max(validFromMonth, Math.min(12, toMonth));

  // Ensure aggregated summaries exist before querying
  await ensureMonthlySummariesForRange(userId, year, validFromMonth, validToMonth);

  // ── Single-pass DB fetch for monthly summaries ────────────────────────────
  const [monthlySummaries, categorySummaries] = await Promise.all([
    prisma.monthlySummary.findMany({
      where: { userId, year, month: { gte: validFromMonth, lte: validToMonth } },
      orderBy: { month: "asc" },
      // Select only fields the DTO needs — no unnecessary data transfer
      select: { month: true, income: true, expense: true, net: true },
    }),

    prisma.monthlyCategorySummary.findMany({
      where: {
        userId,
        year,
        month: { gte: validFromMonth, lte: validToMonth },
        // No type filter — we need both INCOME and EXPENSE for the browser
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: [{ month: "asc" }, { amount: "desc" }],
    }),
  ]);

  // ── Totals ────────────────────────────────────────────────────────────────
  let totalIncome = 0;
  let totalExpense = 0;
  let totalNet = 0;

  monthlySummaries.forEach((s) => {
    totalIncome += s.income;
    totalExpense += s.expense;
    totalNet += s.net;
  });

  const expenseRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const savingRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0;
  const monthsCount = monthlySummaries.length;

  // ── Monthly trend ─────────────────────────────────────────────────────────
  const monthlyTrend = monthlySummaries.map((s) => ({
    month: s.month,
    monthName: MONTH_NAMES[s.month - 1],
    income: s.income,
    expense: s.expense,
    net: s.net,
  }));

  // ── Annual top categories (EXPENSE only) ──────────────────────────────────
  const expenseCategoryMap = new Map<string, { name: string; amount: number }>();
  categorySummaries
    .filter((c) => c.type === "EXPENSE")
    .forEach((c) => {
      const existing = expenseCategoryMap.get(c.categoryId);
      if (existing) {
        existing.amount += c.amount;
      } else {
        expenseCategoryMap.set(c.categoryId, { name: c.category.name, amount: c.amount });
      }
    });

  const topCategories = Array.from(expenseCategoryMap.entries())
    .map(([categoryId, { name, amount }]) => ({
      categoryId,
      categoryName: name,
      amount,
      percentageOfExpense: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // ── Monthly category breakdown ────────────────────────────────────────────
  // Group categories by month, compute per-type totals for percentage
  const monthCatMap = new Map<number, { income: MonthCategoryEntry[]; expense: MonthCategoryEntry[] }>();

  // Initialize for every month in range (even empty ones)
  for (let m = validFromMonth; m <= validToMonth; m++) {
    monthCatMap.set(m, { income: [], expense: [] });
  }

  // Group into typed buckets per month
  const rawByMonth = new Map<number, Map<string, { name: string; amount: number; type: string }>>();
  categorySummaries.forEach((c) => {
    if (!rawByMonth.has(c.month)) rawByMonth.set(c.month, new Map());
    const key = `${c.categoryId}-${c.type}`;
    const bucket = rawByMonth.get(c.month)!;
    const existing = bucket.get(key);
    if (existing) {
      existing.amount += c.amount;
    } else {
      bucket.set(key, { name: c.category.name, amount: c.amount, type: c.type });
    }
  });

  // Build structured breakdown with percentages
  const monthlyCategoryBreakdown: MonthCategoryBreakdown[] = [];

  for (let m = validFromMonth; m <= validToMonth; m++) {
    const monthSummary = monthlySummaries.find((s) => s.month === m);
    const monthIncome = monthSummary?.income ?? 0;
    const monthExpense = monthSummary?.expense ?? 0;

    const rawEntries = rawByMonth.get(m) ?? new Map();
    const categories: MonthCategoryEntry[] = Array.from(rawEntries.entries()).map(([key, v]) => {
      const isIncome = v.type === "INCOME";
      const monthTotal = isIncome ? monthIncome : monthExpense;
      return {
        // Extract categoryId from composite key safely
        categoryId: key.replace(`-${v.type}`, ""),
        categoryName: v.name,
        amount: v.amount,
        type: v.type as "INCOME" | "EXPENSE",
        percentage: monthTotal > 0 ? (v.amount / monthTotal) * 100 : 0,
      };
    }).sort((a, b) => b.amount - a.amount);

    monthlyCategoryBreakdown.push({
      month: m,
      monthName: MONTH_NAMES[m - 1],
      totalIncome: monthIncome,
      totalExpense: monthExpense,
      categories,
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────────
  let highestExpenseMonth: number | null = null;
  let lowestSavingMonth: number | null = null;
  let maxExpense = -Infinity;
  let minSaving = Infinity;

  let bestSavingMonth: AnnualRatios["bestSavingMonth"] = null;
  let worstSpendingMonth: AnnualRatios["worstSpendingMonth"] = null;
  let maxNet = -Infinity;
  let deficitMonthsCount = 0;

  monthlySummaries.forEach((s) => {
    if (s.expense > maxExpense) {
      maxExpense = s.expense;
      highestExpenseMonth = s.month;
      worstSpendingMonth = { month: s.month, monthName: MONTH_NAMES[s.month - 1], expense: s.expense };
    }
    if (s.net < minSaving) {
      minSaving = s.net;
      lowestSavingMonth = s.month;
    }
    if (s.net > maxNet) {
      maxNet = s.net;
      bestSavingMonth = { month: s.month, monthName: MONTH_NAMES[s.month - 1], net: s.net };
    }
    if (s.net < 0) deficitMonthsCount++;
  });

  const expenseValues = monthlySummaries.map((s) => s.expense);
  const expenseVolatility = calculateVolatility(expenseValues);

  const avgMonthlyIncome = monthsCount > 0 ? totalIncome / monthsCount : 0;
  const avgMonthlyExpense = monthsCount > 0 ? totalExpense / monthsCount : 0;
  const monthsOfSurplus = totalNet > 0 && avgMonthlyExpense > 0
    ? totalNet / avgMonthlyExpense
    : null;

  const ratios: AnnualRatios = {
    savingsRate: savingRate,
    expenseRatio: expenseRate,
    avgMonthlyIncome,
    avgMonthlyExpense,
    monthsOfSurplus,
    deficitMonthsCount,
    bestSavingMonth,
    worstSpendingMonth,
    consistencyScore: volatilityToConsistency(expenseVolatility),
  };

  return {
    year,
    range: { fromMonth: validFromMonth, toMonth: validToMonth },
    totals: { income: totalIncome, expense: totalExpense, net: totalNet, expenseRate, savingRate },
    monthlyTrend,
    topCategories,
    monthlyCategoryBreakdown,
    ratios,
    insights: { highestExpenseMonth, lowestSavingMonth, expenseVolatility },
  };
});
