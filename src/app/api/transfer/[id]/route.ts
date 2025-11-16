import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and load transfer with transactions
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!transfer || transfer.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Revert transfer atomically
    await prisma.$transaction(async (tx) => {
      // Revert account balances
      await tx.account.update({
        where: { id: transfer.fromAccountId },
        data: { balance: { increment: transfer.amount } },
      });

      await tx.account.update({
        where: { id: transfer.toAccountId },
        data: { balance: { decrement: transfer.amount } },
      });

      // Delete transactions (cascade should handle this, but explicit is safer)
      await tx.transaction.deleteMany({
        where: { transferId: transfer.id },
      });

      // Delete transfer
      await tx.transfer.delete({
        where: { id: transfer.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete transfer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete transfer" },
      { status: 500 }
    );
  }
}

