/**
 * Financial Percentage Mode Types and Constants
 * 
 * This file defines the two distinct percentage calculation modes:
 * - INCOME_BASED (Mode A): For monthly analysis, uses income as 100% baseline
 * - CASH_FLOW_PROPORTION (Mode B): For daily/weekly views, shows proportion of total cash flow
 */

export enum PercentageMode {
  /**
   * Mode A: "Basis Income"
   * 
   * WHEN TO USE:
   * - Monthly period analysis
   * - Financial health metrics
   * - When income data is stable and meaningful
   * 
   * FORMULA:
   * - Expense % = (expense / income) * 100
   * - Net % = (net / income) * 100
   * - Income is the 100% baseline
   * 
   * REQUIREMENT:
   * - Income must be > 0 (auto-fallback to CASH_FLOW_PROPORTION if income = 0)
   */
  INCOME_BASED = 'INCOME_BASED',

  /**
   * Mode B: "Proporsi Arus Kas"
   * 
   * WHEN TO USE:
   * - Daily or weekly period analysis
   * - When income is sporadic/unstable
   * - Visual proportion display (NOT a financial health metric)
   * 
   * FORMULA:
   * - Income % = (income / (income + expense)) * 100
   * - Expense % = (expense / (income + expense)) * 100
   * - Total cash flow is the 100% baseline
   * 
   * NOTE:
   * - This is descriptive visualization only
   * - Not a prescriptive financial metric
   * - Do NOT use "dari income" terminology in labels
   */
  CASH_FLOW_PROPORTION = 'CASH_FLOW_PROPORTION',
}

/**
 * Human-readable labels for each mode
 */
export const PERCENTAGE_MODE_LABELS = {
  [PercentageMode.INCOME_BASED]: 'Income',
  [PercentageMode.CASH_FLOW_PROPORTION]: 'Cash Flow',
} as const;

/**
 * Detailed descriptions explaining what each mode shows
 */
export const PERCENTAGE_MODE_DESCRIPTIONS = {
  [PercentageMode.INCOME_BASED]: 'Menghitung persentase berdasarkan income sebagai 100%',
  [PercentageMode.CASH_FLOW_PROPORTION]: 'Menunjukkan proporsi arus kas, bukan rasio terhadap income',
} as const;

/**
 * Helper text to display in the chart based on active mode
 */
export const PERCENTAGE_MODE_HELPER_TEXT = {
  [PercentageMode.INCOME_BASED]: 'Persentase relatif terhadap income',
  [PercentageMode.CASH_FLOW_PROPORTION]: 'Menunjukkan proporsi arus kas, bukan rasio terhadap income',
} as const;

/**
 * Get the smart default mode based on the selected period
 * 
 * LOGIC:
 * - Monthly → INCOME_BASED (income data is typically stable monthly)
 * - Daily/Weekly → CASH_FLOW_PROPORTION (income is often sporadic)
 */
export function getDefaultModeForPeriod(period: 'day' | 'week' | 'month'): PercentageMode {
  return period === 'month' 
    ? PercentageMode.INCOME_BASED 
    : PercentageMode.CASH_FLOW_PROPORTION;
}
