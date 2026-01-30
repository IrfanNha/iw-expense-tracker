import { prisma } from "@/lib/prisma";
import { BillStatus } from "@/generated/prisma";

export interface GetBillsParams {
  userId: string;
  status?: BillStatus | "ALL";
  limit?: number;
  orderBy?: "dueDate" | "createdAt";
}

export async function getBills(params: GetBillsParams) {
  const { userId, status = "ALL", limit, orderBy = "dueDate" } = params;

  const now = new Date();

  // Build where clause with proper typing
  const where: {
    userId: string;
    status?: BillStatus;
  } = {
    userId,
  };

  if (status !== "ALL") {
    where.status = status;
  }

  // Fetch bills with relations
  const bills = await prisma.bill.findMany({
    where,
    include: {
      category: true,
      payments: {
        include: {
          transaction: true,
        },
      },
    },
    orderBy: {
      [orderBy]: orderBy === "dueDate" ? "asc" : "desc",
    },
    take: limit,
  });

  // Calculate paid amounts and apply overdue logic
  const billsWithCalculations = bills.map((bill) => {
    const totalPaid = bill.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const remaining = bill.totalAmount - totalPaid;
    const progress = bill.totalAmount > 0 
      ? (totalPaid / bill.totalAmount) * 100 
      : 0;

    // Determine effective status (overdue takes precedence)
    let effectiveStatus = bill.status;
    if (
      bill.status !== "PAID" &&
      new Date(bill.dueDate) < now
    ) {
      effectiveStatus = "OVERDUE" as BillStatus;
    }

    return {
      ...bill,
      totalPaid,
      remaining,
      progress,
      effectiveStatus,
    };
  });

  return billsWithCalculations;
}
