/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { deleteCategoryBudget } from "@/lib/budgets/delete-category-budget";

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

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteCategoryBudget({
      id,
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Delete budget error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete budget" },
      { status: 500 }
    );
  }
}
