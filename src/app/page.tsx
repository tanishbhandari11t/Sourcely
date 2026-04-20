"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GradientBarsBackground from "@/components/ui/gradient-bars-background";
import Image from "next/image";
import LoginPage from "@/components/ui/animated-characters-login-page";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndParams = async () => {
      // 1. Detect OAuth Code in the WRONG URL (Home instead of Callback)
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      
      if (code) {
        window.location.href = `/auth/callback?code=${code}`;
        return;
      }

      // 2. Check if already logged in (Bypass splash and login)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
        return;
      }

      // 3. Splash Timer
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);

      return () => clearTimeout(timer);
    };

    checkAuthAndParams();
  }, [router, supabase]);

  if (showSplash) {
    return (
      <GradientBarsBackground
        numBars={9}
        gradientFrom="#008B8B"
        backgroundColor="#0B0F14"
      >
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-1000">
          <div className="size-24 relative animate-pulse">
            <Image src="/logo.svg" alt="Sourcely" fill className="object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
            Sourcely<span className="text-[#008B8B]">.</span>
          </h1>
          <p className="text-gray-400 font-medium tracking-widest uppercase text-sm animate-pulse">
            Processing Knowledge...
          </p>
        </div>
      </GradientBarsBackground>
    );
  }

  return <LoginPage />;
}
