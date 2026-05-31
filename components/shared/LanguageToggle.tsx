"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LOCALES, getLocaleMeta } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getLocaleMeta(locale);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fullLocales = LOCALES.filter((l) => l.full);
  const moreLocales = LOCALES.filter((l) => !l.full);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("nav.language")}
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className={compact ? "hidden sm:inline" : ""}>{current.native}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 max-h-[70vh] w-60 overflow-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl"
          role="listbox"
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.language")}
          </p>
          {fullLocales.map((l) => (
            <LangItem
              key={l.code}
              code={l.code}
              native={l.native}
              english={l.english}
              active={l.code === locale}
              onSelect={() => {
                setLocale(l.code);
                setOpen(false);
              }}
            />
          ))}
          <div className="my-1.5 border-t border-border" />
          <p className="px-3 py-1 text-[11px] text-muted-foreground">More languages</p>
          {moreLocales.map((l) => (
            <LangItem
              key={l.code}
              code={l.code}
              native={l.native}
              english={l.english}
              active={l.code === locale}
              onSelect={() => {
                setLocale(l.code);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LangItem({
  native,
  english,
  active,
  onSelect,
}: {
  code: string;
  native: string;
  english: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      role="option"
      aria-selected={active}
      className={cn(
        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
        active && "bg-primary-soft",
      )}
    >
      <span className="flex flex-col leading-tight">
        <span className="font-medium text-foreground">{native}</span>
        <span className="text-xs text-muted-foreground">{english}</span>
      </span>
      {active && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}
