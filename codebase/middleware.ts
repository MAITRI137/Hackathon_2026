import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicRoutes } from "@/lib/auth/route-access";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Public routes
  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return NextResponse.next();
  }

  // Check if session token exists
  const sessionToken = request.cookies.get("transitops_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // The actual permissions check will be done by layout.tsx and page.tsx via requireUser/requirePermission
  // This is because we can't do DB queries in Next.js middleware (Edge runtime doesn't support Prisma with SQLite)

  // If the user accesses the root path, redirect to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
