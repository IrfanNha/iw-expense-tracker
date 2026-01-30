import { prisma } from "@/lib/prisma";

export interface UpdateBillData {
  billId: string;
  userId: string;
  name?: string;
  categoryId?: string;
  totalAmount?: number;
  dueDate?: Date;
  note?: string;
}

export async function updateBill(data: UpdateBillData) {
  const { billId, userId, ...updates } = data;

  // Get current bill with payments
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      payments: true,
    },
  });

  if (!bill) {
    throw new Error("Bill not found");
  }

  if (bill.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Prevent editing fully paid bills
  if (bill.status === "PAID") {
    throw new Error("Cannot edit a fully paid bill");
  }

  // If updating total amount, validate it's not less than already paid
  if (updates.totalAmount !== undefined) {
    const totalPaid = bill.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    if (updates.totalAmount < totalPaid) {
      throw new Error(
        `New total amount (${updates.totalAmount}) cannot be less than already paid amount (${totalPaid})`
      );
    }

    if (updates.totalAmount <= 0) {
      throw new Error("Total amount must be positive");
    }
  }

  // Update bill
  const updatedBill = await prisma.bill.update({
    where: { id: billId },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
      ...(updates.totalAmount !== undefined && { totalAmount: updates.totalAmount }),
      ...(updates.dueDate && { dueDate: updates.dueDate }),
      ...(updates.note !== undefined && { note: updates.note }),
    },
    include: {
      category: true,
      payments: true,
    },
  });

  return updatedBill;
}
