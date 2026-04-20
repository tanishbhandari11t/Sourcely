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
      // LOG IT LOCALLY (Safety first)
      console.error('CRITICAL AUTH ERROR:', error.message);
      
      // REDIRECT WITH A TINY CODE (To prevent 431 loops)
      return NextResponse.redirect(`${origin}/?error=auth_fail`);
    }

    if (!data.session) {
       return NextResponse.redirect(`${origin}/?error=no_session`);
    }

    // Success! 
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/?error=no_code`);
}
