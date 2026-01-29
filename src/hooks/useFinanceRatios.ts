/**
 * Financial Ratios Hook with Dual-Mode Support
 * 
 * Calculates financial metrics with two distinct modes:
 * 
 * MODE A - INCOME_BASED (Default for monthly):
 * Income is the 100% baseline. Shows what percentage of income
 * is spent vs saved. This is the CORRECT financial health metric.
 * 
 * MODE B - CASH_FLOW_PROPORTION (Default for daily/weekly):
 * Shows the proportion of total cash flow. This is a DESCRIPTIVE
 * visualization only, not a financial health metric. Useful when
 * income is sporadic or zero.
 * 
 * @example Mode A - Income-based
 * const ratios = useFinanceRatios(1000, 600, PercentageMode.INCOME_BASED);
 * // Result: { 
 * //   incomeBasedExpensePercentage: 60,  // 60% of income spent
 * //   incomeBasedNetPercentage: 40       // 40% of income saved
 * // }
 * 
 * @example Mode B - Cash Flow Proportion
 * const ratios = useFinanceRatios(1000, 600, PercentageMode.CASH_FLOW_PROPORTION);
 * // Result: {
 * //   cashFlowIncomePercentage: 62.5,    // Income is 62.5% of total flow
 * //   cashFlowExpensePercentage: 37.5    // Expense is 37.5% of total flow
 * // }
 */

import { useMemo } from "react";
import { PercentageMode } from "@/types/finance";

export interface FinanceRatios {
  /** Raw income amount */
  income: number;
  /** Raw expense amount */
  expense: number;
  /** Raw net amount (income - expense) */
  net: number;
  
  /** Active calculation mode */
  mode: PercentageMode;
  
  // MODE A: Income-based percentages
  /** Expense as percentage of income: (expense / income) * 100 */
  incomeBasedExpensePercentage: number;
  /** Net/Savings as percentage of income: (net / income) * 100 */
  incomeBasedNetPercentage: number;
  
  // MODE B: Cash flow proportion
  /** Income as percentage of total cash flow: (income / (income + expense)) * 100 */
  cashFlowIncomePercentage: number;
  /** Expense as percentage of total cash flow: (expense / (income + expense)) * 100 */
  cashFlowExpensePercentage: number;
  
  /** Whether there is income data available for Mode A calculations */
  hasIncome: boolean;
  /** Whether expenses exceed income (deficit situation) */
  isDeficit: boolean;
  /** Whether Mode A can be used (income > 0) */
  canUseIncomeBasedMode: boolean;
}

export function useFinanceRatios(
  income: number,
  expense: number,
  mode: PercentageMode = PercentageMode.INCOME_BASED
): FinanceRatios {
  return useMemo(() => {
    // Preserve raw values without mutation
    const net = income - expense;

    // Check if we have income data for Mode A calculations
    const hasIncome = income > 0;
    const canUseIncomeBasedMode = hasIncome;

    // Detect deficit situation (spending more than earning)
    const isDeficit = expense > income;

    // MODE A: Income-based percentages
    // Financial principle: Income is the total available resource (100%)
    // Expense and Net are calculated as portions of that baseline
    const incomeBasedExpensePercentage = hasIncome ? (expense / income) * 100 : 0;
    const incomeBasedNetPercentage = hasIncome ? (net / income) * 100 : 0;

    // MODE B: Cash Flow Proportion
    // Descriptive visualization: Shows proportion of total cash flow
    // This is NOT a financial health metric, just visual proportion
    const totalCashFlow = income + expense;
    const cashFlowIncomePercentage = totalCashFlow > 0 ? (income / totalCashFlow) * 100 : 0;
    const cashFlowExpensePercentage = totalCashFlow > 0 ? (expense / totalCashFlow) * 100 : 0;

    // Validation for MODE A: Ensure percentages sum to 100% (allowing for floating point rounding)
    if (mode === PercentageMode.INCOME_BASED && hasIncome && process.env.NODE_ENV === "development") {
      const sum = incomeBasedExpensePercentage + incomeBasedNetPercentage;
      const tolerance = 0.01; // Allow 0.01% rounding error
      if (Math.abs(sum - 100) > tolerance) {
        console.warn(
          "[useFinanceRatios] Mode A percentage validation failed:",
          {
            income,
            expense,
            net,
            incomeBasedExpensePercentage,
            incomeBasedNetPercentage,
            sum,
            expected: 100,
            difference: sum - 100,
          }
        );
      }
    }

    // Validation for MODE B: Ensure percentages sum to 100%
    if (mode === PercentageMode.CASH_FLOW_PROPORTION && totalCashFlow > 0 && process.env.NODE_ENV === "development") {
      const sum = cashFlowIncomePercentage + cashFlowExpensePercentage;
      const tolerance = 0.01;
      if (Math.abs(sum - 100) > tolerance) {
        console.warn(
          "[useFinanceRatios] Mode B percentage validation failed:",
          {
            income,
            expense,
            totalCashFlow,
            cashFlowIncomePercentage,
            cashFlowExpensePercentage,
            sum,
            expected: 100,
            difference: sum - 100,
          }
        );
      }
    }

    return {
      income,
      expense,
      net,
      mode,
      incomeBasedExpensePercentage,
      incomeBasedNetPercentage,
      cashFlowIncomePercentage,
      cashFlowExpensePercentage,
      hasIncome,
      isDeficit,
      canUseIncomeBasedMode,
    };
  }, [income, expense, mode]);
}
