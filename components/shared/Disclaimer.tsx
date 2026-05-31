"use client";

import { Info, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/** Persistent footer disclaimer — shown on every guidance screen. */
export function DisclaimerFooter() {
  const t = useT();
  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">{t("disclaimer.persistent")}</p>
        </div>
      </div>
    </footer>
  );
}

/** Small inline badge used near legal steps. */
export function DisclaimerBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-medium text-warning",
        className,
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {t("disclaimer.badge")}
    </span>
  );
}

/** An inline callout box restating the disclaimer for a specific task. */
export function DisclaimerNote() {
  const t = useT();
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft/60 p-3.5">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p className="text-xs leading-relaxed text-foreground/80">{t("disclaimer.persistent")}</p>
    </div>
  );
}
