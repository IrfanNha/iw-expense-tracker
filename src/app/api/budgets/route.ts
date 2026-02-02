/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { categoryBudgetSchema } from "@/lib/validators";
import { getCategoryBudgets } from "@/lib/budgets/get-category-budgets";
import { upsertCategoryBudget } from "@/lib/budgets/upsert-category-budget";

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

    const budgets = await getCategoryBudgets({
      userId: session.user.id,
      year,
      month,
    });

    return NextResponse.json({ budgets });
  } catch (error: any) {
    console.error("Get budgets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch budgets" },
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
    const parsed = categoryBudgetSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { categoryId, year, month, amount } = parsed.data;

    const budget = await upsertCategoryBudget({
      userId: session.user.id,
      categoryId,
      year,
      month,
      amount,
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error: any) {
    console.error("Upsert budget error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create/update budget" },
      { status: 500 }
    );
  }
}
