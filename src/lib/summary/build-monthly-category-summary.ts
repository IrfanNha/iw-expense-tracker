/**
 * Monthly Category Summary Builder
 * 
 * AGGREGATION LAYER - CAN READ TRANSACTION TABLE
 * 
 * Builds MonthlyCategorySummary by grouping transactions by category.
 * 
 * Rules:
 * - Group by categoryId and type (INCOME | EXPENSE)
 * - Ignore transactions without category
 * - Ignore TRANSFER_* types
 * - One row per (userId, year, month, categoryId)
 */

import { prisma } from "@/lib/prisma";
import { type CategoryAggregation, isIncomeType, isExpenseType } from "./types";

/**
 * Aggregate transactions by category for a specific month
 * 
 * @param userId - User ID
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Array of category aggregations
 */
async function aggregateCategoryData(
  userId: string,
  year: number,
  month: number
): Promise<CategoryAggregation[]> {
  // Calculate date range
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Fetch transactions with categories
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      occurredAt: {
        gte: startDate,
        lte: endDate,
      },
      categoryId: {
        not: null, // Only transactions with categories
      },
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  // Group by categoryId and type
  const categoryMap = new Map<string, CategoryAggregation>();

  transactions.forEach((tx) => {
    if (!tx.categoryId || !tx.category) return;

    // Ignore transfers
    if (!isIncomeType(tx.type) && !isExpenseType(tx.type)) return;

    const key = `${tx.categoryId}-${tx.type}`;
    const existing = categoryMap.get(key);

    if (existing) {
      existing.amount += tx.amount;
    } else {
      categoryMap.set(key, {
        categoryId: tx.categoryId,
        categoryName: tx.category.name,
        amount: tx.amount,
        type: tx.type,
      });
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Build and upsert MonthlyCategorySummary
 * 
 * @param userId - User ID
 * @param year - Year
 * @param month - Month (1-12)
 * 
 * IDEMPOTENT:
 * - Deletes existing summaries for the month
 * - Creates new summaries from scratch
 * - Safe to call multiple times
 * 
 * WHY DELETE+CREATE instead of UPSERT:
 * - Categories can be deleted
 * - Number of categories can change
 * - Simpler to rebuild than to diff
 */
export async function buildMonthlyCategorySummary(
  userId: string,
  year: number,
  month: number
): Promise<void> {
  // Aggregate category data
  const categoryAggregations = await aggregateCategoryData(userId, year, month);

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Delete existing summaries for this month
    await tx.monthlyCategorySummary.deleteMany({
      where: {
        userId,
        year,
        month,
      },
    });

    // Create new summaries
    if (categoryAggregations.length > 0) {
      await tx.monthlyCategorySummary.createMany({
        data: categoryAggregations.map((cat) => ({
          userId,
          year,
          month,
          categoryId: cat.categoryId,
          amount: cat.amount,
          type: cat.type,
        })),
      });
    }
  });
}
