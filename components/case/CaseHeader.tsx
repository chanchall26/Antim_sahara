"use client";

import { motion } from "motion/react";
import { ProgressRing } from "@/components/ui/progress";
import { useT } from "@/lib/i18n/I18nProvider";
import { progressPercent } from "@/lib/store/caseLogic";
import type { EstateCase } from "@/types";

function fmt(date?: string) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function CaseHeader({ c }: { c: EstateCase }) {
  const t = useT();
  const pct = progressPercent(c.summary);
  const dob = fmt(c.deceased.dob);
  const dod = fmt(c.deceased.dod);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
    >
      <div className="relative bg-[linear-gradient(135deg,var(--primary-soft)_0%,var(--gold-soft)_42%,var(--rose-soft)_78%,var(--secondary-soft)_100%)] p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-sm">
              {/* small diya */}
              <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
                <g className="candle-flicker">
                  <path d="M24 10c3 3.4 4.4 6 4.4 8.6a4.4 4.4 0 0 1-8.8 0c0-1.8.7-3.2 1.8-4.8C22.6 16 24 13.4 24 10Z" fill="#c2703d" />
                </g>
                <path d="M10 30c3.8 3.4 9.4 5.2 14 5.2s10.2-1.8 14-5.2c-1.3 4.4-6.5 7.8-14 7.8S11.3 34.4 10 30Z" fill="#4c51bf" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("roadmap.forMemoryOf")}
              </p>
              <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">
                {c.deceased.name}
              </h1>
              {(dob || dod) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {dob ?? "—"} &nbsp;–&nbsp; {dod ?? "—"}
                </p>
              )}
            </div>
          </div>

          <ProgressRing
            value={pct}
            size={92}
            label={`${pct}%`}
            sublabel={t("roadmap.progressRing", { done: c.summary.doneTasks, total: c.summary.totalTasks })}
          />
        </div>
      </div>
    </motion.div>
  );
}
