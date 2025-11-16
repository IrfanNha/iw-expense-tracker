/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        ...(accountId && { accountId }),
        ...(type && { type: type as any }),
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
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
    const parsed = transactionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { accountId, categoryId, amount, type, note, occurredAt } =
      parsed.data;

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

    // Create transaction and update account balance atomically
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
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

      // Update account balance
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

      return transaction;
    });

    return NextResponse.json({ transaction: result }, { status: 201 });
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}
