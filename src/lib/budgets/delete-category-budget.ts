import { prisma } from "@/lib/prisma";

export interface DeleteCategoryBudgetParams {
  id: string;
  userId: string;
}

export async function deleteCategoryBudget(params: DeleteCategoryBudgetParams) {
  const { id, userId } = params;

  // Verify budget exists and belongs to user
  const budget = await prisma.categoryBudget.findUnique({
    where: { id },
  });

  if (!budget) {
    throw new Error("Budget not found");
  }

  if (budget.userId !== userId) {
    throw new Error("Budget does not belong to user");
  }

  // Delete the budget (no cascading to transactions/summaries)
  await prisma.categoryBudget.delete({
    where: { id },
  });

  return { success: true, message: "Budget deleted successfully" };
}
