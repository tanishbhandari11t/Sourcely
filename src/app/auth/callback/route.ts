import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('CRITICAL AUTH ERROR:', error.message);
      // Redirect to home with a simple, short error flag
      return NextResponse.redirect(`${origin}/?error=auth_fail`);
    }
  }

  // IMPORTANT: Redirect WITHOUT the code param to prevent loops and 431 bloat
  // We go to /dashboard (or the 'next' param) to ensure a clean landing.
  return NextResponse.redirect(`${origin}${next}`);
}
