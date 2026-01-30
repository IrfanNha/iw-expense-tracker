/**
 * Monthly Summary Resync API Endpoint
 * 
 * POST /api/reports/resync
 * 
 * PURPOSE:
 * Manual resync of monthly summaries when transaction data changes.
 * This endpoint forces a rebuild of MonthlySummary and MonthlyCategorySummary
 * for the specified year and month range.
 * 
 * SECURITY:
 * - Requires authentication (NextAuth session)
 * - Only syncs current user's data
 * - Validates input parameters
 * 
 * PERFORMANCE:
 * - Processes months in parallel
 * - Only rebuilds requested range (not entire history)
 * - Efficient database operations (upsert)
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { NextRequest, NextResponse } from "next/server";
import { forceRebuildMonthlySummaries } from "@/lib/summary/ensure-monthly-summary";

/**
 * Request body schema
 */
interface ResyncRequestBody {
  year: number;
  fromMonth?: number;
  toMonth?: number;
}

/**
 * POST handler for resync operation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION: Verify user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // 2. PARSE REQUEST BODY
    let body: ResyncRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    // 3. VALIDATE INPUT PARAMETERS
    const { year, fromMonth = 1, toMonth = 12 } = body;

    // Validate year
    if (!year || typeof year !== "number" || year < 2000 || year > 2100) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid year. Must be a number between 2000 and 2100." 
        },
        { status: 400 }
      );
    }

    // Validate months
    if (
      typeof fromMonth !== "number" ||
      typeof toMonth !== "number" ||
      fromMonth < 1 ||
      fromMonth > 12 ||
      toMonth < 1 ||
      toMonth > 12 ||
      fromMonth > toMonth
    ) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid month range. Months must be between 1 and 12, and fromMonth must be <= toMonth." 
        },
        { status: 400 }
      );
    }

    // 4. EXECUTE RESYNC OPERATION
    const syncedMonths = await forceRebuildMonthlySummaries(
      session.user.id,
      year,
      fromMonth,
      toMonth
    );

    // 5. RETURN SUCCESS RESPONSE
    const monthText = syncedMonths === 1 ? "month" : "months";
    return NextResponse.json(
      {
        success: true,
        message: `Successfully resynced ${syncedMonths} ${monthText} for year ${year}.`,
        syncedMonths,
        details: {
          year,
          fromMonth,
          toMonth,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    // 6. ERROR HANDLING
    console.error("Error in resync API:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during resync.",
      },
      { status: 500 }
    );
  }
}
