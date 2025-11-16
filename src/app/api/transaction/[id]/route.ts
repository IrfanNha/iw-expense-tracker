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

    // Verify ownership
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Don't allow deletion of transfer transactions
    if (
      existing.type === "TRANSFER_DEBIT" ||
      existing.type === "TRANSFER_CREDIT"
    ) {
      return NextResponse.json(
        { error: "Cannot delete transfer transactions. Delete the transfer instead." },
        { status: 400 }
      );
    }

    // Delete transaction and revert account balance atomically
    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id },
      });

      // Revert account balance
      if (existing.type === "INCOME") {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { decrement: existing.amount } },
        });
      } else if (existing.type === "EXPENSE") {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: existing.amount } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete transaction" },
      { status: 500 }
    );
  }
}

