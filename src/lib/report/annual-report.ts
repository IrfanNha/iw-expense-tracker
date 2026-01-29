/**
 * Annual Report Data Access Layer
 * 
 * CRITICAL RULES:
 * 1. NEVER query Transaction table for annual reports
 * 2. Use ONLY pre-aggregated tables:
 *    - MonthlySummary
 *    - MonthlyCategorySummary
 *    - AnnualSummary (optional cache)
 * 3. All percentages MUST be income-based
 * 4. Expense% + Savings% = 100% (relative to income)
 * 
 * WHY:
 * - Transaction table is for real-time operations
 * - Annual reports need pre-aggregated data for performance
 * - Income is the financial baseline (100% of available resources)
 */

import { prisma } from "@/lib/prisma";
import { ensureMonthlySummariesForRange } from "@/lib/summary/ensure-monthly-summary";

/**
 * Annual Report Data Transfer Object
 * 
 * This structure is optimized for UI consumption.
 * All calculations are done server-side to minimize client work.
 */
export type AnnualReportDTO = {
  year: number;
  range: {
    fromMonth: number; // 1-12
    toMonth: number;   // 1-12
  };

  /** Core financial metrics */
  totals: {
    income: number;        // Total income in cents
    expense: number;       // Total expense in cents
    net: number;           // Income - Expense
    expenseRate: number;   // (expense / income) * 100
    savingRate: number;    // (net / income) * 100
  };

  /** Month-by-month breakdown for trend visualization */
  monthlyTrend: Array<{
    month: number;         // 1-12
    monthName: string;     // "January", "February", etc.
    income: number;
    expense: number;
    net: number;
  }>;

  /** Top spending categories */
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentageOfExpense: number;  // Relative to TOTAL expense, not income
  }>;

  /** Actionable insights for decision-making */
  insights: {
    highestExpenseMonth: number | null;  // Month number (1-12)
    lowestSavingMonth: number | null;    // Month number (1-12)
    expenseVolatility: "LOW" | "MEDIUM" | "HIGH";
  };
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Calculate expense volatility based on standard deviation
 * 
 * WHY: Helps users understand spending consistency
 * - LOW: Predictable spending
 * - MEDIUM: Some variation
 * - HIGH: Erratic spending (needs attention)
 */
function calculateVolatility(expenses: number[]): "LOW" | "MEDIUM" | "HIGH" {
  if (expenses.length < 2) return "LOW";

  const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
  const variance = expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / expenses.length;
  const stdDev = Math.sqrt(variance);
  
  // Coefficient of variation (CV)
  const cv = mean > 0 ? (stdDev / mean) : 0;

  if (cv < 0.15) return "LOW";
  if (cv < 0.30) return "MEDIUM";
  return "HIGH";
}

/**
 * Get Annual Financial Report
 * 
 * @param userId - User ID
 * @param year - Year to report on
 * @param fromMonth - Start month (1-12), default 1 (January)
 * @param toMonth - End month (1-12), default 12 (December)
 * @returns Normalized annual report DTO
 * 
 * PERFORMANCE:
 * - Queries only aggregated tables (fast)
 * - Single database round-trip per entity type
 * - No client-side heavy computation
 */
export async function getAnnualReport(
  userId: string,
  year: number,
  fromMonth: number = 1,
  toMonth: number = 12
): Promise<AnnualReportDTO> {
  // Validate month range
  const validFromMonth = Math.max(1, Math.min(12, fromMonth));
  const validToMonth = Math.max(1, Math.min(12, toMonth));

  // AGGREGATION LAYER: Ensure summaries exist before querying
  // This is the ONLY integration point with the summary engine
  await ensureMonthlySummariesForRange(userId, year, validFromMonth, validToMonth);

  // Fetch monthly summaries for the year range
  const monthlySummaries = await prisma.monthlySummary.findMany({
    where: {
      userId,
      year,
      month: {
        gte: validFromMonth,
        lte: validToMonth,
      },
    },
    orderBy: {
      month: "asc",
    },
  });

  // Fetch category summaries for the year range
  const categorySummaries = await prisma.monthlyCategorySummary.findMany({
    where: {
      userId,
      year,
      month: {
        gte: validFromMonth,
        lte: validToMonth,
      },
      type: "EXPENSE", // Only expense categories for breakdown
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  let totalNet = 0;

  monthlySummaries.forEach((summary) => {
    totalIncome += summary.income;
    totalExpense += summary.expense;
    totalNet += summary.net;
  });

  // Calculate income-based percentages
  // CRITICAL: Income is the 100% baseline
  const expenseRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const savingRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0;

  // Build monthly trend
  const monthlyTrend = monthlySummaries.map((summary) => ({
    month: summary.month,
    monthName: MONTH_NAMES[summary.month - 1],
    income: summary.income,
    expense: summary.expense,
    net: summary.net,
  }));

  // Aggregate categories across all months
  const categoryMap = new Map<string, { name: string; amount: number }>();
  
  categorySummaries.forEach((catSummary) => {
    const existing = categoryMap.get(catSummary.categoryId);
    if (existing) {
      existing.amount += catSummary.amount;
    } else {
      categoryMap.set(catSummary.categoryId, {
        name: catSummary.category.name,
        amount: catSummary.amount,
      });
    }
  });

  // Convert to array and sort by amount (descending)
  const sortedCategories = Array.from(categoryMap.entries())
    .map(([categoryId, { name, amount }]) => ({
      categoryId,
      categoryName: name,
      amount,
      // Percentage relative to TOTAL EXPENSE (not income)
      percentageOfExpense: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Take top 5 categories
  const topCategories = sortedCategories.slice(0, 5);

  // Generate insights
  let highestExpenseMonth: number | null = null;
  let lowestSavingMonth: number | null = null;
  let maxExpense = 0;
  let minSaving = Infinity;

  monthlySummaries.forEach((summary) => {
    if (summary.expense > maxExpense) {
      maxExpense = summary.expense;
      highestExpenseMonth = summary.month;
    }
    if (summary.net < minSaving) {
      minSaving = summary.net;
      lowestSavingMonth = summary.month;
    }
  });

  const expenseValues = monthlySummaries.map((s) => s.expense);
  const expenseVolatility = calculateVolatility(expenseValues);

  return {
    year,
    range: {
      fromMonth: validFromMonth,
      toMonth: validToMonth,
    },
    totals: {
      income: totalIncome,
      expense: totalExpense,
      net: totalNet,
      expenseRate,
      savingRate,
    },
    monthlyTrend,
    topCategories,
    insights: {
      highestExpenseMonth,
      lowestSavingMonth,
      expenseVolatility,
    },
  };
}
