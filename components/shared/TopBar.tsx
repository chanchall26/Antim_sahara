"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export function TopBar() {
  const { user, signOut } = useAuth();
  const t = useT();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href={user ? "/dashboard" : "/"} aria-label="Antim Sahara home">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle compact />

          {user && (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
                aria-label={t("nav.account")}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                  {(user.displayName ?? "?").charAt(0).toUpperCase()}
                </span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-border bg-card p-1.5 shadow-xl"
                  role="menu"
                >
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user.displayName ?? "Friend"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email ?? user.phone ?? (user.isDemo ? "Demo session" : "")}
                      </p>
                    </div>
                  </div>
                  <div className="my-1 border-t border-border" />
                  <Link
                    href="/account/privacy"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    {t("nav.privacy")}
                  </Link>
                  <button
                    role="menuitem"
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
