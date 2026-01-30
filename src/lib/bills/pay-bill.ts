import { prisma } from "@/lib/prisma";
import { BillStatus } from "@/generated/prisma";

export interface PayBillData {
  billId: string;
  userId: string;
  accountId: string;
  amount: number;
  note?: string;
}

export async function payBill(data: PayBillData) {
  const { billId, userId, accountId, amount, note } = data;

  // Validate payment amount
  if (amount <= 0) {
    throw new Error("Payment amount must be positive");
  }

  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get bill with current payments
    const bill = await tx.bill.findUnique({
      where: { id: billId },
      include: {
        payments: true,
        category: true,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    if (bill.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (bill.status === "PAID") {
      throw new Error("Bill is already fully paid");
    }

    // Calculate current paid amount
    const totalPaid = bill.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const remaining = bill.totalAmount - totalPaid;

    // Validate payment doesn't exceed remaining
    if (amount > remaining) {
      throw new Error(
        `Payment amount (${amount}) exceeds remaining balance (${remaining})`
      );
    }

    // Create Transaction (EXPENSE)
    const transaction = await tx.transaction.create({
      data: {
        userId,
        accountId,
        categoryId: bill.categoryId,
        amount,
        type: "EXPENSE",
        note: note || `Payment for bill: ${bill.name}`,
        occurredAt: new Date(),
      },
    });

    // Update account balance
    await tx.account.update({
      where: { id: accountId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    // Create BillPayment
    const billPayment = await tx.billPayment.create({
      data: {
        billId,
        transactionId: transaction.id,
        amount,
      },
    });

    // Calculate new total paid
    const newTotalPaid = totalPaid + amount;

    // Determine new status
    let newStatus: BillStatus;
    if (newTotalPaid >= bill.totalAmount) {
      newStatus = "PAID";
    } else if (newTotalPaid > 0) {
      newStatus = "PARTIAL";
    } else {
      newStatus = "UNPAID";
    }

    // Update bill status
    const updatedBill = await tx.bill.update({
      where: { id: billId },
      data: {
        status: newStatus,
      },
      include: {
        category: true,
        payments: {
          include: {
            transaction: true,
          },
        },
      },
    });

    return {
      bill: updatedBill,
      transaction,
      billPayment,
    };
  });

  return result;
}
