import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Read the flag at module level (evaluated once per cold-start, which is correct for middleware).
const isRegisterEnabled = process.env.APP_ENABLE_REGISTER === "true";

export default withAuth(
  function middleware(req: NextRequest) {
    // Block /register when registration is disabled
    if (
      !isRegisterEnabled &&
      req.nextUrl.pathname.startsWith("/register")
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }
        // Allow everything else (auth routes, public pages)
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/register",
    "/register/:path*",
    "/api/auth/callback/:path*",
  ],
};

