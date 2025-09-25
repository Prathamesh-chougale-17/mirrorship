import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  
  // Allow public routes
  if (request.nextUrl.pathname === "/") {
    return NextResponse.next();
  }
  
  // Allow auth routes
  if (request.nextUrl.pathname.startsWith("/api/auth") || 
      request.nextUrl.pathname.startsWith("/sign-in") || 
      request.nextUrl.pathname.startsWith("/sign-up")) {
    return NextResponse.next();
  }
  
  // Redirect to sign-in if no session cookie
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};