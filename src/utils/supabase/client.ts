"use client";
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // OPTIMIZATION: Ensure we don't accidentally bloat headers in the browser
        getAll() {
          return document.cookie.split('; ').map(c => {
            const [name, ...value] = c.split('=');
            return { name, value: value.join('=') };
          });
        },
        setAll(cookiesToSet) {
           // Standard browser setting
        }
      }
    }
  );
