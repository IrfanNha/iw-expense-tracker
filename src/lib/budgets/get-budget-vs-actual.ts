import { prisma } from "@/lib/prisma";

export interface GetBudgetVsActualParams {
  userId: string;
  year: number;
  month: number;
}

export interface BudgetVsActual {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  actualAmount: number;
  remainingAmount: number;
  usageRate: number;
  overBudget: boolean;
}

export async function getBudgetVsActual(
  params: GetBudgetVsActualParams
): Promise<BudgetVsActual[]> {
  const { userId, year, month } = params;

  // Fetch all budgets for the month
  const budgets = await prisma.categoryBudget.findMany({
    where: {
      userId,
      year,
      month,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          isIncome: true,
        },
      },
    },
  });

  // Filter to expense categories only
  const expenseBudgets = budgets.filter(
    (budget) => budget.category.isIncome === false
  );

  // If no budgets, return empty array
  if (expenseBudgets.length === 0) {
    return [];
  }

  // Calculate month boundaries for filtering transactions
  const startOfMonth = new Date(year, month - 1, 1); // First day of month, 00:00:00
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month, 23:59:59

  // Get budgeted category IDs for efficient filtering
  const budgetCategoryIds = expenseBudgets.map((b) => b.categoryId);

  // REAL-TIME: Aggregate transactions directly from Transaction table
  // This ensures budget tracking is always up-to-date
  const transactionTotals = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      categoryId: { in: budgetCategoryIds },
      type: 'EXPENSE',
      occurredAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Create map of categoryId -> actualAmount
  // CRITICAL: Transaction amounts are stored in CENTS
  // Budget amounts are stored in FULL RUPIAH
  // Must divide by 100 to convert cents to rupiah!
  const actualAmountMap = new Map<string, number>();
  transactionTotals.forEach((total) => {
    if (total.categoryId && total._sum.amount) {
      // Convert cents to rupiah: 1,500,000 cents = 15,000 rupiah
      const amountInRupiah = total._sum.amount / 100;
      actualAmountMap.set(total.categoryId, amountInRupiah);
    }
  });

  // Compute budget vs actual for each budget
  const budgetVsActual: BudgetVsActual[] = expenseBudgets.map((budget) => {
    const actualAmount = actualAmountMap.get(budget.categoryId) || 0;
    const remainingAmount = budget.amount - actualAmount;
    const usageRate = budget.amount > 0 ? (actualAmount / budget.amount) * 100 : 0;
    const overBudget = actualAmount > budget.amount;

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      categoryIcon: budget.category.icon,
      budgetAmount: budget.amount,
      actualAmount,
      remainingAmount,
      usageRate,
      overBudget,
    };
  });

  // Sort by category name
  budgetVsActual.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  return budgetVsActual;
}
