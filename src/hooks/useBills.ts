import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BillStatus } from "@/generated/prisma";

export interface Bill {
  id: string;
  userId: string;
  name: string;
  categoryId: string | null;
  totalAmount: number;
  dueDate: string;
  status: BillStatus;
  isRecurring: boolean;
  recurrence: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    isIncome: boolean;
    icon: string | null;
  } | null;
  payments?: Array<{
    id: string;
    billId: string;
    transactionId: string;
    amount: number;
    paidAt: string;
  }>;
  totalPaid?: number;
  remaining?: number;
  progress?: number;
  effectiveStatus?: BillStatus;
  isOverdue?: boolean;
}

export function useBills(params?: {
  status?: BillStatus | "ALL";
  limit?: number;
}) {
  return useQuery<Bill[]>({
    queryKey: ["bills", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.limit) searchParams.set("limit", params.limit.toString());

      const res = await fetch(`/api/bills?${searchParams.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch bills");
      }
      const data = await res.json();
      return data.bills;
    },
  });
}

export function useBill(billId?: string) {
  return useQuery<Bill>({
    queryKey: ["bills", billId],
    queryFn: async () => {
      if (!billId) throw new Error("Bill ID is required");
      
      const res = await fetch(`/api/bills/${billId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch bill");
      }
      const data = await res.json();
      return data.bill;
    },
    enabled: !!billId,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: {
      name: string;
      categoryId?: string;
      totalAmount: number;
      dueDate: string;
      note?: string;
      isRecurring?: boolean;
      recurrence?: string;
    }) => {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create bill");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function usePayBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      billId: string;
      accountId: string;
      amount: number;
      note?: string;
    }) => {
      const res = await fetch(`/api/bills/${payment.billId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: payment.accountId,
          amount: payment.amount,
          note: payment.note,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to pay bill");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      bill,
    }: {
      id: string;
      bill: {
        name?: string;
        categoryId?: string;
        totalAmount?: number;
        dueDate?: string;
        note?: string;
      };
    }) => {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update bill");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, force }: { id: string; force?: boolean }) => {
      const res = await fetch(`/api/bills/${id}?force=${force || false}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete bill");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
