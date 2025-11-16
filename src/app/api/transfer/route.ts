import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { transferSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transfers = await prisma.transfer.findMany({
      where: { userId: session.user.id },
      include: {
        fromAccount: true,
        toAccount: true,
        transactions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transfers });
  } catch (error: any) {
    console.error("Get transfers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = transferSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { fromAccountId, toAccountId, amount, note, occurredAt } =
      parsed.data;

    const userId = session.user.id;

    // Run atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Load accounts and validate ownership
      const [fromAcc, toAcc] = await Promise.all([
        tx.account.findUnique({ where: { id: fromAccountId } }),
        tx.account.findUnique({ where: { id: toAccountId } }),
      ]);

      if (!fromAcc || !toAcc) {
        throw new Error("Account not found");
      }

      if (fromAcc.userId !== userId || toAcc.userId !== userId) {
        throw new Error("Not authorized for these accounts");
      }

      // Check balance
      if (fromAcc.balance < amount) {
        throw new Error("Insufficient funds");
      }

      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          userId,
          fromAccountId,
          toAccountId,
          amount,
          note: note || null,
        },
      });

      const occurredDate = occurredAt ? new Date(occurredAt) : new Date();

      // Create debit transaction (from)
      const debitTx = await tx.transaction.create({
        data: {
          userId,
          accountId: fromAccountId,
          amount,
          type: "TRANSFER_DEBIT",
          note: note || null,
          occurredAt: occurredDate,
          transferId: transfer.id,
        },
      });

      // Create credit transaction (to)
      const creditTx = await tx.transaction.create({
        data: {
          userId,
          accountId: toAccountId,
          amount,
          type: "TRANSFER_CREDIT",
          note: note || null,
          occurredAt: occurredDate,
          transferId: transfer.id,
        },
      });

      // Update balances
      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });

      return {
        transfer,
        debitTx,
        creditTx,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      { error: error.message || "Transfer failed" },
      { status: 400 }
    );
  }
}

