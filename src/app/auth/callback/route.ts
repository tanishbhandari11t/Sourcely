import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('OAuth exchange error:', error.message);
      return NextResponse.redirect(`${origin}/?error=OAuthExchangeFailed`);
    }

    // Success! Redirect to dashboard
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code found, probably an error from provider
  return NextResponse.redirect(`${origin}/?error=NoCodeProvided`);
}
