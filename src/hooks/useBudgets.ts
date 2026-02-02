import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CategoryBudget {
  id: string;
  userId: string;
  categoryId: string;
  year: number;
  month: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    isIncome: boolean;
  };
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

export function useBudgets(params: { year: number; month: number }) {
  return useQuery<CategoryBudget[]>({
    queryKey: ["budgets", params.year, params.month],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        year: params.year.toString(),
        month: params.month.toString(),
      });

      const res = await fetch(`/api/budgets?${searchParams.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch budgets");
      }
      const data = await res.json();
      return data.budgets;
    },
  });
}

export function useBudgetVsActual(params: { year: number; month: number }) {
  return useQuery<BudgetVsActual[]>({
    queryKey: ["budget-vs-actual", params.year, params.month],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        year: params.year.toString(),
        month: params.month.toString(),
      });

      const res = await fetch(`/api/budgets/vs-actual?${searchParams.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch budget vs actual");
      }
      const data = await res.json();
      return data.budgetVsActual;
    },
  });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: {
      categoryId: string;
      year: number;
      month: number;
      amount: number;
    }) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budget),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create/update budget");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["budgets", variables.year, variables.month] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["budget-vs-actual", variables.year, variables.month] 
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete budget");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-vs-actual"] });
    },
  });
}
