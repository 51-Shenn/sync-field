"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SplashScreen({ href, onDone }: { href: string; onDone?: () => void }) {
  const router = useRouter();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      router.push(href);
      onDone?.();
    }, 1800);
    return () => clearTimeout(t);
  }, [href, onDone, router]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#132238] transition-opacity duration-500" style={{ opacity: fadeIn ? 1 : 0 }}>
      <img src="/syncfield.svg" alt="SyncField" className="h-100 w-auto animate-pulse" />
      <p className="text-sm font-medium">Setting up your workspace…</p>
    </div>
  );
}
