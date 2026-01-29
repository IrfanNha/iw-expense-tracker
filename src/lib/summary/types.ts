/**
 * Monthly Summary Shared Types
 * 
 * Used by the aggregation layer to build summary tables.
 * 
 * LAYER SEPARATION:
 * - This file is part of AGGREGATION LAYER (can read Transaction)
 * - Reporting layer (annual-report.ts) only reads summary tables
 */

import { TxType } from "@/generated/prisma/client";

/**
 * Year-Month range for summary operations
 */
export interface YearMonthRange {
  year: number;
  month: number; // 1-12
}

/**
 * Result of summary build operation
 */
export interface SummaryBuildResult {
  created: boolean;
  updated: boolean;
  upserted: boolean;
}

/**
 * Aggregated transaction data for a month
 */
export interface MonthlyAggregation {
  income: number;
  expense: number;
  net: number;
}

/**
 * Category-wise aggregation for a month
 */
export interface CategoryAggregation {
  categoryId: string;
  categoryName: string;
  amount: number;
  type: TxType;
}

/**
 * Transaction types that should be counted as income
 */
export const INCOME_TYPES: TxType[] = ["INCOME"];

/**
 * Transaction types that should be counted as expense
 */
export const EXPENSE_TYPES: TxType[] = ["EXPENSE"];

/**
 * Transaction types that should be ignored in summaries
 * (Transfers are internal movements, not income/expense)
 */
export const IGNORED_TYPES: TxType[] = ["TRANSFER_DEBIT", "TRANSFER_CREDIT"];

/**
 * Check if transaction type should be counted as income
 */
export function isIncomeType(type: TxType): boolean {
  return INCOME_TYPES.includes(type);
}

/**
 * Check if transaction type should be counted as expense
 */
export function isExpenseType(type: TxType): boolean {
  return EXPENSE_TYPES.includes(type);
}

/**
 * Check if transaction type should be ignored in summaries
 */
export function isIgnoredType(type: TxType): boolean {
  return IGNORED_TYPES.includes(type);
}
