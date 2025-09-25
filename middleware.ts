import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow static assets (images, css, js, etc.)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.') // This catches files with extensions like .png, .jpg, .ico, etc.
  ) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  
  // Allow public routes
  if (pathname === "/") {
    return NextResponse.next();
  }
  
  // Allow auth routes
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return NextResponse.next();
  }
  
  // Redirect to sign-in if no session cookie for protected routes
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
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
     * - Files with extensions (images, css, js, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};