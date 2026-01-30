/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { payBillSchema } from "@/lib/validators";
import { payBill } from "@/lib/bills/pay-bill";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: billId } = await params;
    const json = await req.json();

    const parsed = payBillSchema.safeParse({
      billId,
      ...json,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { accountId, amount, note } = parsed.data;

    // Verify account ownership
    const { prisma } = await import("@/lib/prisma");
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const result = await payBill({
      billId,
      userId: session.user.id,
      accountId,
      amount,
      note,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Pay bill error:", error);
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("already paid") || error.message.includes("exceeds remaining")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to pay bill" },
      { status: 500 }
    );
  }
}
