import { prisma } from "@/lib/prisma";

export interface UpsertCategoryBudgetParams {
  userId: string;
  categoryId: string;
  year: number;
  month: number;
  amount: number;
}

export async function upsertCategoryBudget(params: UpsertCategoryBudgetParams) {
  const { userId, categoryId, year, month, amount } = params;

  // Validate amount is positive
  if (amount <= 0) {
    throw new Error("Budget amount must be positive");
  }

  // Validate category exists and belongs to user
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.userId !== userId) {
    throw new Error("Category does not belong to user");
  }

  // Validate category is expense type (not income)
  if (category.isIncome === true) {
    throw new Error("Cannot create budget for income category");
  }

  // Upsert the budget
  const budget = await prisma.categoryBudget.upsert({
    where: {
      userId_categoryId_year_month: {
        userId,
        categoryId,
        year,
        month,
      },
    },
    update: {
      amount,
      updatedAt: new Date(),
    },
    create: {
      userId,
      categoryId,
      year,
      month,
      amount,
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

  return budget;
}
