import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  // FIX: THE SURGICAL FILTER
  // We ONLY pass cookies that start with 'sb-' to Supabase.
  // This ignores all the 'bloat' cookies from other localhost projects.
  const allCookies = cookieStore.getAll();
  const filteredCookies = allCookies.filter(c => c.name.startsWith('sb-'));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return filteredCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Safe catch
          }
        },
      },
    }
  );
};
