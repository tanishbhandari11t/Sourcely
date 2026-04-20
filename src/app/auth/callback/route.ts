import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('OAuth exchange error:', error.message);
      // REVEAL THE TRUTH: Pass the actual error message into the URL for debugging
      return NextResponse.redirect(`${origin}/?error=OAuthExchangeFailed&reason=${encodeURIComponent(error.message)}`);
    }

    if (!data.session) {
       return NextResponse.redirect(`${origin}/?error=NoSessionFound`);
    }

    // Success! 
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/?error=NoCodeProvided`);
}
