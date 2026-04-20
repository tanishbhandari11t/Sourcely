import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  // SSR SAFE CHECK: Only run cookie logic in the browser
  const isBrowser = typeof window !== 'undefined';

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          if (!isBrowser) return [];
          return document.cookie.split('; ').map(c => {
            const [name, ...value] = c.split('=');
            return { name, value: value.join('=') };
          });
        },
        setAll(cookiesToSet) {
          if (!isBrowser) return;
          cookiesToSet.forEach(({ name, value, options }) => {
            // Standard browser cookie setting with options
            let cookieStr = `${name}=${value}; Path=/; SameSite=Lax`;
            if (options?.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
            if (options?.secure) cookieStr += `; Secure`;
            document.cookie = cookieStr;
          });
        }
      }
    }
  );
};
