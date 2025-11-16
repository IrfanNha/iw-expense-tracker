import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import {
  encryptBackup,
  arrayBufferToBase64,
  uint8ArrayToBase64,
} from "@/lib/encryption";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Ensure crypto.subtle is available (Node.js 18+ or Edge Runtime)
export const runtime = "nodejs";

const exportSchema = z.object({
  pin: z.string().min(6, "PIN is required").max(10).regex(/^\d+$/, "PIN must contain only digits"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const json = await req.json();
    const parsed = exportSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid PIN format", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Verify PIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPin: true },
    });

    if (!user || !user.hashedPin) {
      return NextResponse.json(
        { error: "User PIN not found" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(parsed.data.pin, user.hashedPin);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Fetch all user data
    const [accounts, categories, transactions, transfers] = await Promise.all([
      prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: {
          account: true,
          category: true,
        },
        orderBy: { occurredAt: "asc" },
      }),
      prisma.transfer.findMany({
        where: { userId },
        include: {
          fromAccount: true,
          toAccount: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Format data for export
    const exportData = {
      accounts: accounts.map((acc) => ({
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        icon: acc.icon,
        balance: acc.balance,
      })),
      categories: categories.map((cat) => ({
        name: cat.name,
        isIncome: cat.isIncome,
        icon: cat.icon,
      })),
      transactions: transactions
        .filter((tx) => tx.type === "INCOME" || tx.type === "EXPENSE")
        .map((tx) => ({
          accountName: tx.account.name,
          categoryName: tx.category?.name || null,
          amount: tx.amount,
          type: tx.type,
          note: tx.note,
          occurredAt: tx.occurredAt.toISOString(),
        })),
      transfers: transfers.map((transfer) => ({
        fromAccountName: transfer.fromAccount.name,
        toAccountName: transfer.toAccount.name,
        amount: transfer.amount,
        note: transfer.note,
        createdAt: transfer.createdAt.toISOString(),
      })),
    };

    // Encrypt data
    const { encrypted, iv, signature } = await encryptBackup(
      exportData,
      parsed.data.pin,
      userId
    );

    // Create backup file structure (encrypted)
    const backupFile = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      encryptedData: arrayBufferToBase64(encrypted),
      iv: uint8ArrayToBase64(iv),
      signature,
    };

    // Convert to binary format
    const backupJson = JSON.stringify(backupFile);
    const backupBuffer = new TextEncoder().encode(backupJson);

    // Return encrypted file
    return new NextResponse(backupBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().split("T")[0]}.enc"`,
      },
    });
  } catch (error: any) {
    console.error("Export data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 }
    );
  }
}

