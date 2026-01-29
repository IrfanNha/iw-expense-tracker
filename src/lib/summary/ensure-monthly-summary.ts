/**
 * Monthly Summary Orchestrator
 * 
 * ENTRY POINT for summary auto-generation.
 * 
 * This function:
 * 1. Checks if summaries exist
 * 2. If not → builds them
 * 3. Is IDEMPOTENT (safe to call multiple times)
 * 
 * USAGE:
 * - Called from annual-report.ts before reading summaries
 * - Can be called from cron jobs
 * - Can be called from API endpoints
 * 
 * PERFORMANCE:
 * - Fast check (indexed query)
 * - Only builds if missing
 * - Uses Prisma transactions for consistency
 */

import { prisma } from "@/lib/prisma";
import { buildMonthlySummary } from "./build-monthly-summary";
import { buildMonthlyCategorySummary } from "./build-monthly-category-summary";

/**
 * Check if MonthlySummary exists for given parameters
 */
async function monthlySummaryExists(
  userId: string,
  year: number,
  month: number
): Promise<boolean> {
  const summary = await prisma.monthlySummary.findUnique({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
    select: {
      id: true, // Only select minimal data
    },
  });

  return summary !== null;
}

/**
 * Check if MonthlyCategorySummary exists for given parameters
 */
async function monthlyCategorySummaryExists(
  userId: string,
  year: number,
  month: number
): Promise<boolean> {
  const count = await prisma.monthlyCategorySummary.count({
    where: {
      userId,
      year,
      month,
    },
  });

  // If count > 0, summaries exist
  // If count = 0, could mean:
  // - No transactions with categories
  // - Summaries not built yet
  // We'll rebuild to be safe
  return count > 0;
}

/**
 * Ensure Monthly Summaries Exist
 * 
 * @param userId - User ID
 * @param year - Year
 * @param month - Month (1-12)
 * 
 * BEHAVIOR:
 * - If both summaries exist → return immediately (fast)
 * - If either missing → rebuild BOTH (ensures consistency)
 * 
 * IDEMPOTENT:
 * - Safe to call multiple times
 * - No side effects if summaries already exist
 * - Rebuilds are safe (upsert/delete+create)
 * 
 * THREAD-SAFE:
 * - Uses Prisma transactions
 * - Unique constraints prevent duplicates
 * 
 * @example
 * // In annual-report.ts
 * await ensureMonthlySummary(userId, 2026, 1);
 * // Now safe to query MonthlySummary
 */
export async function ensureMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<void> {
  // Quick check: do both summaries exist?
  const [hasMonthlySummary, hasCategorySummary] = await Promise.all([
    monthlySummaryExists(userId, year, month),
    monthlyCategorySummaryExists(userId, year, month),
  ]);

  // If both exist, we're done (fast path)
  if (hasMonthlySummary && hasCategorySummary) {
    return;
  }

  // Rebuild both summaries for consistency
  // Use try-catch to handle potential race conditions gracefully
  try {
    await Promise.all([
      buildMonthlySummary(userId, year, month),
      buildMonthlyCategorySummary(userId, year, month),
    ]);
  } catch (error) {
    // If error is due to unique constraint (race condition),
    // it means another process already created the summary
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      // Ignore - summary was created by another process
      return;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Ensure summaries for a range of months
 * 
 * Useful for:
 * - Backfilling historical data
 * - Annual report with custom date range
 * 
 * @param userId - User ID
 * @param year - Year
 * @param fromMonth - Start month (1-12)
 * @param toMonth - End month (1-12)
 */
export async function ensureMonthlySummariesForRange(
  userId: string,
  year: number,
  fromMonth: number,
  toMonth: number
): Promise<void> {
  const promises: Promise<void>[] = [];

  for (let month = fromMonth; month <= toMonth; month++) {
    promises.push(ensureMonthlySummary(userId, year, month));
  }

  await Promise.all(promises);
}
