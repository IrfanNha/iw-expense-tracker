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
 * Ensure summaries for a range of months — OPTIMIZED BATCH VERSION
 *
 * WHY: Original code did N*2 individual DB queries (one findUnique per month
 * for each table). For a full year (12 months), that's 24 round-trips.
 *
 * OPTIMIZED: 2 findMany queries to fetch all existing months at once,
 * then only rebuild the months that are actually missing.
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
  // BATCH CHECK: 2 queries instead of N*2 queries
  const [existingMonthly, existingCategoryMonths] = await Promise.all([
    // Query 1: which months have MonthlySummary?
    prisma.monthlySummary.findMany({
      where: { userId, year, month: { gte: fromMonth, lte: toMonth } },
      select: { month: true },
    }),
    // Query 2: which months have MonthlyCategorySummary?
    prisma.monthlyCategorySummary.findMany({
      where: { userId, year, month: { gte: fromMonth, lte: toMonth } },
      select: { month: true },
      distinct: ["month"],
    }),
  ]);

  const hasMonthly = new Set(existingMonthly.map((r) => r.month));
  const hasCategory = new Set(existingCategoryMonths.map((r) => r.month));

  // Collect months that need rebuilding
  const missingMonths: number[] = [];
  for (let month = fromMonth; month <= toMonth; month++) {
    if (!hasMonthly.has(month) || !hasCategory.has(month)) {
      missingMonths.push(month);
    }
  }

  // Fast path: all summaries exist
  if (missingMonths.length === 0) return;

  // Rebuild only the missing months in parallel
  await Promise.all(
    missingMonths.map((month) =>
      Promise.all([
        buildMonthlySummary(userId, year, month),
        buildMonthlyCategorySummary(userId, year, month),
      ]).catch((error) => {
        // Race condition: another process already created the summary — safe to ignore
        if (
          error instanceof Error &&
          error.message.includes("Unique constraint")
        ) {
          return;
        }
        throw error;
      })
    )
  );
}


/**
 * Force Rebuild Monthly Summaries
 * 
 * MANUAL RESYNC OPERATION
 * 
 * Unlike ensureMonthlySummary, this function ALWAYS rebuilds summaries
 * without checking if they exist. This is used for manual resync operations
 * when users want to refresh data after making changes.
 * 
 * @param userId - User ID
 * @param year - Year
 * @param fromMonth - Start month (1-12)
 * @param toMonth - End month (1-12)
 * @returns Number of months synced
 * 
 * PERFORMANCE:
 * - Processes months in parallel for speed
 * - Reuses existing build functions
 * - Safe to call multiple times (idempotent)
 * 
 * SECURITY:
 * - Only affects the specified user's data
 * - Uses Prisma's built-in protections
 * 
 * @example
 * // Resync January-June 2026
 * const count = await forceRebuildMonthlySummaries(userId, 2026, 1, 6);
 * console.log(`Resynced ${count} months`);
 */
export async function forceRebuildMonthlySummaries(
  userId: string,
  year: number,
  fromMonth: number,
  toMonth: number
): Promise<number> {
  // Validate month range
  const validFromMonth = Math.max(1, Math.min(12, fromMonth));
  const validToMonth = Math.max(1, Math.min(12, toMonth));

  const promises: Promise<void>[] = [];

  for (let month = validFromMonth; month <= validToMonth; month++) {
    // Force rebuild both summaries for each month
    promises.push(
      Promise.all([
        buildMonthlySummary(userId, year, month),
        buildMonthlyCategorySummary(userId, year, month),
      ]).then(() => {})
    );
  }

  await Promise.all(promises);

  // Return the number of months synced
  return validToMonth - validFromMonth + 1;
}
