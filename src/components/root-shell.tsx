"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { authClient } from "@/lib/auth-client";

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isLandingPage = pathname === "/";

  useEffect(() => {
    if (!isLandingPage && !isPending && !session?.user) router.replace("/");
  }, [isLandingPage, isPending, router, session?.user]);

  if (isLandingPage) return children;
  if (isPending || !session?.user) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <img src="/syncfield.svg" alt="SyncField" className="h-120 w-auto" />
    </div>
  );
  return <AppShell>{children}</AppShell>;
}
