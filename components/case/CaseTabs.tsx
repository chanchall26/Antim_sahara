"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Footprints, FolderLock, Route, Search } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function CaseTabs({ caseId }: { caseId: string }) {
  const t = useT();
  const pathname = usePathname();
  const base = `/case/${caseId}`;

  const tabs = [
    { href: base, label: t("roadmap.title"), icon: Route, exact: true },
    { href: `${base}/guide`, label: t("guide.tab"), icon: Footprints, exact: false },
    { href: `${base}/documents`, label: t("vault.title"), icon: FolderLock, exact: false },
    { href: `${base}/unclaimed`, label: t("unclaimed.title"), icon: Search, exact: false },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
