import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { updateNameSchema, updatePinSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { type, ...data } = json;

    if (type === "name") {
      const parsed = updateNameSchema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid input",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { name: parsed.data.name },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return NextResponse.json({ user });
    } else if (type === "pin") {
      const parsed = updatePinSchema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid input",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hashedPin: true },
      });

      if (!user || !user.hashedPin) {
        return NextResponse.json(
          { error: "User not found or PIN not set" },
          { status: 404 }
        );
      }

      // Verify current PIN
      const isValid = await bcrypt.compare(
        parsed.data.currentPin,
        user.hashedPin
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 400 }
        );
      }

      // Hash new PIN
      const saltRounds = parseInt(process.env.PIN_SALT_ROUNDS || "12", 10);
      const hashedPin = await bcrypt.hash(parsed.data.newPin, saltRounds);

      // Update PIN
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hashedPin },
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'name' or 'pin'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
