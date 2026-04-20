import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const code = searchParams.get('code');

  // FIX: THE SURGICAL FILTER (Middleware Edition)
  // If we are on an auth path, just pass through to keep headers tiny.
  if (code || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          // Only read Supabase-related cookies to prevent 431
          return request.cookies.getAll().filter(c => c.name.startsWith('sb-'));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ["/((?!static|.*\\..*|_next).*)"],
};
