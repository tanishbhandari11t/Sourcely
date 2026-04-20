import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // FIX: THE 431 KILLER
  // If we see a code, we MUST get the browser AWAY from the root page and away from old cookies.
  if (code && request.nextUrl.pathname === '/') {
    const redirectUrl = new URL('/auth/callback', origin);
    redirectUrl.searchParams.set('code', code);
    
    // Redirect with a CLEAN RESPONSE (This tells the browser to drop the request and start a fresh one at the callback)
    const response = NextResponse.redirect(redirectUrl);
    
    // Wipe any existing Supabase cookies that might be bloating the header
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.includes('sb-')) {
        response.cookies.delete(cookie.name);
      }
    });

    return response;
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // REFRESH SESSION
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
