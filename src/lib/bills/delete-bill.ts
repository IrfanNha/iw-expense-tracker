import { prisma } from "@/lib/prisma";

export interface DeleteBillData {
  billId: string;
  userId: string;
  force?: boolean; // Allow deletion even with payments (preserves transactions)
}

export async function deleteBill(data: DeleteBillData) {
  const { billId, userId, force = false } = data;

  // Get bill with payments
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

  // Check if bill has payments
  if (bill.payments.length > 0 && !force) {
    throw new Error(
      "Bill has payments. Set force=true to delete (transactions will be preserved)"
    );
  }

  // Delete bill (cascade will delete BillPayments, but preserve Transactions)
  await prisma.bill.delete({
    where: { id: billId },
  });

  return true;
}
