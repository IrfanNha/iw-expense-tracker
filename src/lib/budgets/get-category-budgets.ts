import { prisma } from "@/lib/prisma";

export interface GetCategoryBudgetsParams {
  userId: string;
  year: number;
  month: number;
}

export async function getCategoryBudgets(params: GetCategoryBudgetsParams) {
  const { userId, year, month } = params;

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
    orderBy: {
      category: {
        name: "asc",
      },
    },
  });

  // Filter to only include expense categories
  const expenseBudgets = budgets.filter(
    (budget) => budget.category.isIncome === false
  );

  return expenseBudgets;
}
