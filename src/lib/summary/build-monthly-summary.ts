/**
 * Monthly Summary Builder
 * 
 * AGGREGATION LAYER - CAN READ TRANSACTION TABLE
 * 
 * Builds MonthlySummary by aggregating Transaction data.
 * This is the ONLY place where Transaction is queried for summary purposes.
 * 
 * Rules:
 * - INCOME type → income
 * - EXPENSE type → expense
 * - TRANSFER_* → ignored (internal movements)
 * - Net = income - expense
 */

import { prisma } from "@/lib/prisma";
import { type MonthlyAggregation, isIncomeType, isExpenseType } from "./types";

/**
 * Build MonthlySummary for a specific user, year, and month
 * 
 * @param userId - User ID
 * @param year - Year (e.g., 2026)
 * @param month - Month (1-12)
 * @returns Aggregated monthly data
 * 
 * PERFORMANCE:
 * - Single query with aggregation
 * - Filters by occurredAt range
 * - Groups by transaction type
 */
async function aggregateMonthlyData(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyAggregation> {
  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in Date
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

  // Fetch all transactions for the month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      occurredAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      type: true,
    },
  });

  let income = 0;
  let expense = 0;

  // Aggregate based on transaction type
  transactions.forEach((tx) => {
    if (isIncomeType(tx.type)) {
      income += tx.amount;
    } else if (isExpenseType(tx.type)) {
      expense += tx.amount;
    }
    // Ignore TRANSFER_* types
  });

  const net = income - expense;

  return { income, expense, net };
}

/**
 * Build and upsert MonthlySummary
 * 
 * @param userId - User ID
 * @param year - Year
 * @param month - Month (1-12)
 * 
 * IDEMPOTENT:
 * - Safe to call multiple times
 * - Uses upsert (create if not exists, update if exists)
 * - Respects unique constraint on (userId, year, month)
 */
export async function buildMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<void> {
  // Aggregate transaction data
  const aggregation = await aggregateMonthlyData(userId, year, month);

  // Upsert MonthlySummary
  // This is SAFE even if called multiple times
  await prisma.monthlySummary.upsert({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
    create: {
      userId,
      year,
      month,
      income: aggregation.income,
      expense: aggregation.expense,
      net: aggregation.net,
    },
    update: {
      income: aggregation.income,
      expense: aggregation.expense,
      net: aggregation.net,
    },
  });
}
