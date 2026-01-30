import { prisma } from "@/lib/prisma";

export interface CreateBillData {
  userId: string;
  name: string;
  categoryId?: string;
  totalAmount: number;
  dueDate: Date;
  note?: string;
  isRecurring?: boolean;
  recurrence?: string;
}

export async function createBill(data: CreateBillData) {
  // Validate amount
  if (data.totalAmount <= 0) {
    throw new Error("Total amount must be positive");
  }

  // Create bill with UNPAID status (default)
  const bill = await prisma.bill.create({
    data: {
      userId: data.userId,
      name: data.name,
      categoryId: data.categoryId,
      totalAmount: data.totalAmount,
      dueDate: data.dueDate,
      note: data.note,
      isRecurring: data.isRecurring ?? false,
      recurrence: data.recurrence,
      status: "UNPAID", // Explicitly set initial status
    },
    include: {
      category: true,
    },
  });

  return bill;
}
