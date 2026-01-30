/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { billSchema } from "@/lib/validators";
import { getBills } from "@/lib/bills/get-bills";
import { createBill } from "@/lib/bills/create-bill";
import { BillStatus } from "@/generated/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "ALL") as BillStatus | "ALL";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const bills = await getBills({
      userId: session.user.id,
      status,
      limit,
    });

    return NextResponse.json({ bills });
  } catch (error: any) {
    console.error("Get bills error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bills" },
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
    const parsed = billSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, categoryId, totalAmount, dueDate, note, isRecurring, recurrence } =
      parsed.data;

    // Verify category ownership if provided
    if (categoryId) {
      const { prisma } = await import("@/lib/prisma");
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

    const bill = await createBill({
      userId: session.user.id,
      name,
      categoryId,
      totalAmount,
      dueDate: new Date(dueDate),
      note,
      isRecurring,
      recurrence,
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error: any) {
    console.error("Create bill error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bill" },
      { status: 500 }
    );
  }
}
