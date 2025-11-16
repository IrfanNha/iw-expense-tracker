import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Account } from "./useAccounts";
import { Transaction } from "./useTransactions";

export interface Transfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string | null;
  createdAt: string;
  fromAccount?: Account;
  toAccount?: Account;
  transactions?: Transaction[];
}

export function useTransfers() {
  return useQuery<Transfer[]>({
    queryKey: ["transfers"],
    queryFn: async () => {
      const res = await fetch("/api/transfer");
      if (!res.ok) throw new Error("Failed to fetch transfers");
      const data = await res.json();
      return data.transfers;
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transfer: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      note?: string;
      occurredAt?: string;
    }) => {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transfer),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create transfer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transfer/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete transfer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

