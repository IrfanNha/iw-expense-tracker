import { NextResponse } from "next/server";
import { isTurnstileEnabled } from "@/lib/feature-flags";

export async function POST(req: Request) {
  try {
    // Bypass verification when Turnstile is disabled
    if (!isTurnstileEnabled) {
      return NextResponse.json({ success: true });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Turnstile token is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      console.error("TURNSTILE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Turnstile is not configured" },
        { status: 500 }
      );
    }

    // Verify token with Cloudflare
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secretKey, response: token }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { error: "Turnstile verification failed", details: result["error-codes"] },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Turnstile verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify Turnstile token" },
      { status: 500 }
    );
  }
}

