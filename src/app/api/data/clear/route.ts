import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user data in a transaction to ensure atomicity
    // Order matters: transactions -> transfers -> accounts -> categories
    await prisma.$transaction(async (tx) => {
      // Delete all transactions first (they reference accounts, categories, and transfers)
      await tx.transaction.deleteMany({
        where: { userId },
      });

      // Delete all transfers (they reference accounts)
      await tx.transfer.deleteMany({
        where: { userId },
      });

      // Delete all accounts (they reference user)
      await tx.account.deleteMany({
        where: { userId },
      });

      // Delete all categories (they reference user)
      await tx.category.deleteMany({
        where: { userId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "All data has been cleared successfully",
    });
  } catch (error: any) {
    console.error("Clear data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear data" },
      { status: 500 }
    );
  }
}

