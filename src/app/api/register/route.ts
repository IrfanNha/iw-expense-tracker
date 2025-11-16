/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // Check if Turnstile should be disabled (development mode)
    const isDevelopment = process.env.APP_ENV === "development" || 
                          process.env.NODE_ENV === "development";

    const json = await req.json();
    const { turnstileToken, ...userData } = json;

    // Verify Turnstile token only in production
    if (!isDevelopment) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "Security verification is required" },
          { status: 400 }
        );
      }

      const secretKey = process.env.TURNSTILE_SECRET_KEY;
      if (secretKey) {
        const verifyRes = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret: secretKey,
              response: turnstileToken,
            }),
          }
        );

        const verifyResult = await verifyRes.json();
        if (!verifyResult.success) {
          return NextResponse.json(
            { error: "Security verification failed. Please try again." },
            { status: 400 }
          );
        }
      }
    }

    const parsed = registerSchema.safeParse(userData);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, pin } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash PIN
    const saltRounds = parseInt(process.env.PIN_SALT_ROUNDS || "12", 10);
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPin,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
