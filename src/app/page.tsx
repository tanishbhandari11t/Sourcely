"use client";

import { useEffect, useState } from "react";
import GradientBarsBackground from "@/components/ui/gradient-bars-background";
import Image from "next/image";
import LoginPage from "@/components/ui/animated-characters-login-page";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // 1. Detect OAuth Code in the WRONG URL (Home instead of Callback)
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    
    if (code) {
      // Direct hand-off to the hardened server-side callback
      window.location.href = `/auth/callback?code=${code}`;
      return;
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
