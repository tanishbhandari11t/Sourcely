import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  
  // FIX: THE VANILLA BYPASS
  // We completely skip ALL logic if there is a code or we are on an auth path.
  // This keeps the request headers at the absolute minimum (under 1KB).
  if (searchParams.has('code') || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!static|.*\\..*|_next).*)"],
};
