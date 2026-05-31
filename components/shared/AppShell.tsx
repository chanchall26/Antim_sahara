"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TopBar } from "@/components/shared/TopBar";
import { DisclaimerFooter } from "@/components/shared/Disclaimer";
import { Logo } from "@/components/shared/Logo";

/** Wraps authenticated app pages: top bar, route protection, footer disclaimer. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-warm-grain">
        <Logo withWord={false} className="scale-150 animate-pulse" />
        <p className="text-sm text-muted-foreground">Antim Sahara</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm-grain">
      <TopBar />
      <main className="flex-1">{children}</main>
      <DisclaimerFooter />
    </div>
  );
}
