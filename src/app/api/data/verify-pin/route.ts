import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const verifyPinSchema = z.object({
  pin: z.string().min(6, "PIN must be at least 6 digits").max(10).regex(/^\d+$/, "PIN must contain only digits"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = verifyPinSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid PIN format", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Get user with hashed PIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPin: true },
    });

    if (!user || !user.hashedPin) {
      return NextResponse.json(
        { error: "User PIN not found" },
        { status: 404 }
      );
    }

    // Verify PIN
    const isValid = await bcrypt.compare(parsed.data.pin, user.hashedPin);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify PIN error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify PIN" },
      { status: 500 }
    );
  }
}

