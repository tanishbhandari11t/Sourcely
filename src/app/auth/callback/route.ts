import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // FIX: Clear any old cookies before starting a new exchange to prevent 431 Header Too Large
  const response = NextResponse.next();

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('OAuth exchange error:', error.message);
      // Redirect back home with a clear error
      return NextResponse.redirect(`${origin}/?error=OAuthExchangeFailed&msg=${encodeURIComponent(error.message)}`);
    }

    // Success! Redirect to dashboard with a clean state
    const redirectUrl = new URL(next, origin);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // No code found, probably an error from provider
  return NextResponse.redirect(`${origin}/?error=NoCodeProvided`);
}
