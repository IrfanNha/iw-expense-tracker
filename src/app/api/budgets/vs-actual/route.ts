/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { getBudgetVsActual } from "@/lib/budgets/get-budget-vs-actual";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString(), 10);

    // Validate month
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    const budgetVsActual = await getBudgetVsActual({
      userId: session.user.id,
      year,
      month,
    });

    return NextResponse.json({ budgetVsActual });
  } catch (error: any) {
    console.error("Get budget vs actual error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch budget vs actual" },
      { status: 500 }
    );
  }
}
