/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { getBillDetail } from "@/lib/bills/get-bill-detail";
import { updateBill } from "@/lib/bills/update-bill";
import { deleteBill } from "@/lib/bills/delete-bill";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bill = await getBillDetail(id, session.user.id);

    return NextResponse.json({ bill });
  } catch (error: any) {
    console.error("Get bill detail error:", error);
    if (error.message === "Bill not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to fetch bill" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();

    const updateData: any = {
      billId: id,
      userId: session.user.id,
    };

    if (json.name !== undefined) updateData.name = json.name;
    if (json.categoryId !== undefined) updateData.categoryId = json.categoryId;
    if (json.totalAmount !== undefined) updateData.totalAmount = json.totalAmount;
    if (json.dueDate !== undefined) updateData.dueDate = new Date(json.dueDate);
    if (json.note !== undefined) updateData.note = json.note;

    const bill = await updateBill(updateData);

    return NextResponse.json({ bill });
  } catch (error: any) {
    console.error("Update bill error:", error);
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update bill" },
      { status: 400 }
    );
  }
}

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
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    await deleteBill({
      billId: id,
      userId: session.user.id,
      force,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete bill error:", error);
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes("has payments")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete bill" },
      { status: 500 }
    );
  }
}
