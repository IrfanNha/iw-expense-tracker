import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { exportToCSV, type ExportData } from "@/lib/csv-utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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

    // Format data for export with sanitization
    const exportData: ExportData = {
      accounts: accounts.map((acc) => ({
        name: acc.name || "",
        type: acc.type || "CASH",
        currency: acc.currency || "IDR",
        icon: acc.icon || null,
        balance: typeof acc.balance === "number" && isFinite(acc.balance) ? acc.balance : 0,
      })),
      categories: categories.map((cat) => ({
        name: cat.name || "",
        isIncome: Boolean(cat.isIncome),
        icon: cat.icon || null,
      })),
      transactions: transactions
        .filter((tx) => tx.type === "INCOME" || tx.type === "EXPENSE")
        .map((tx) => ({
          accountName: tx.account?.name || "",
          categoryName: tx.category?.name || null,
          amount: typeof tx.amount === "number" && isFinite(tx.amount) && tx.amount > 0 ? tx.amount : 0,
          type: tx.type === "INCOME" || tx.type === "EXPENSE" ? tx.type : "EXPENSE",
          note: tx.note || null,
          occurredAt: tx.occurredAt ? new Date(tx.occurredAt).toISOString() : new Date().toISOString(),
        }))
        .filter((tx) => tx.accountName && tx.amount > 0), // Filter out invalid transactions
      transfers: transfers.map((transfer) => ({
        fromAccountName: transfer.fromAccount?.name || "",
        toAccountName: transfer.toAccount?.name || "",
        amount: typeof transfer.amount === "number" && isFinite(transfer.amount) && transfer.amount > 0 ? transfer.amount : 0,
        note: transfer.note || null,
        createdAt: transfer.createdAt ? new Date(transfer.createdAt).toISOString() : new Date().toISOString(),
      }))
        .filter((t) => t.fromAccountName && t.toAccountName && t.amount > 0), // Filter out invalid transfers
    };

    // Convert to CSV
    const csvContent = exportToCSV(exportData);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().split("T")[0]}.csv"`,
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

