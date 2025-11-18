import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validators";

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();
    const parsed = transactionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { accountId, categoryId, amount, type, note, occurredAt } = parsed.data;

    // Verify ownership
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Don't allow editing transfer transactions
    if (
      existing.type === "TRANSFER_DEBIT" ||
      existing.type === "TRANSFER_CREDIT"
    ) {
      return NextResponse.json(
        { error: "Cannot edit transfer transactions. Edit the transfer instead." },
        { status: 400 }
      );
    }

    // Verify account ownership
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Verify category ownership if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // Update transaction and adjust account balances atomically
    const result = await prisma.$transaction(async (tx) => {
      // Revert old transaction's effect on account balance
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

      // Update transaction
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          accountId,
          categoryId: categoryId || null,
          amount,
          type,
          note: note || null,
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        },
        include: {
          account: true,
          category: true,
        },
      });

      // Apply new transaction's effect on account balance
      if (type === "INCOME") {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        });
      } else if (type === "EXPENSE") {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });
      }

      // If account changed, also update old account balance
      if (existing.accountId !== accountId) {
        // Old account balance was already reverted above
        // No additional action needed
      }

      return updated;
    });

    return NextResponse.json({ transaction: result });
  } catch (error: any) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update transaction" },
      { status: 500 }
    );
  }
}

