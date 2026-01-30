import { prisma } from "@/lib/prisma";

export async function getBillDetail(billId: string, userId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      category: true,
      payments: {
        include: {
          transaction: {
            include: {
              account: true,
            },
          },
        },
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  if (!bill) {
    throw new Error("Bill not found");
  }

  if (bill.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Calculate totals
  const totalPaid = bill.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const remaining = bill.totalAmount - totalPaid;
  const progress = bill.totalAmount > 0 
    ? (totalPaid / bill.totalAmount) * 100 
    : 0;

  // Check if overdue
  const now = new Date();
  const isOverdue = bill.status !== "PAID" && new Date(bill.dueDate) < now;

  return {
    ...bill,
    totalPaid,
    remaining,
    progress,
    isOverdue,
  };
}
