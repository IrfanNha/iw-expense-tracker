import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Account } from "./useAccounts";
import { Category } from "./useCategories";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER_DEBIT" | "TRANSFER_CREDIT";
  note?: string | null;
  occurredAt: string;
  transferId?: string | null;
  createdAt: string;
  account?: Account;
  category?: Category | null;
}

export function useTransactions(params?: {
  accountId?: string;
  type?: string;
  limit?: number;
}) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.accountId) searchParams.set("accountId", params.accountId);
      if (params?.type) searchParams.set("type", params.type);
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      
      const res = await fetch(`/api/transaction?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      return data.transactions;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: {
      accountId: string;
      categoryId?: string;
      amount: number;
      type: "INCOME" | "EXPENSE";
      note?: string;
      occurredAt?: string;
    }) => {
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, transaction }: {
      id: string;
      transaction: {
        accountId: string;
        categoryId?: string;
        amount: number;
        type: "INCOME" | "EXPENSE";
        note?: string;
        occurredAt?: string;
      };
    }) => {
      const res = await fetch(`/api/transaction/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transaction/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

