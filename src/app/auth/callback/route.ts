import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // FIX: THE NUCLEAR COOKIE PURGE
  // We create a response and forcefully clear any stuck cookies that cause 431 errors
  const response = NextResponse.redirect(`${origin}${next}`);

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('OAuth exchange error:', error.message);
      return NextResponse.redirect(`${origin}/?error=OAuthExchangeFailed`);
    }

    // Success! 
    return response;
  }

  return NextResponse.redirect(`${origin}/?error=NoCodeProvided`);
}
