"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { CategoryIcon, DeadlineChip } from "./shared";
import { useT } from "@/lib/i18n/I18nProvider";
import type { CaseTask } from "@/types";

/** The single most important open task — big, obvious, impossible to miss. */
export function NextStep({ task, caseId }: { task: CaseTask; caseId: string }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-warm-hero p-1 shadow-xl"
    >
      <Link
        href={`/case/${caseId}/task/${task.id}`}
        className="group block rounded-[1.35rem] bg-card/70 p-5 backdrop-blur transition-colors hover:bg-card/90 sm:p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="pulse-ring inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            {t("roadmap.nextStepLabel")}
          </span>
        </div>

        <div className="flex items-start gap-4">
          <CategoryIcon category={task.category} />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl font-semibold leading-snug sm:text-2xl">
              {task.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DeadlineChip deadline={task.deadline} />
              <span className="text-xs text-muted-foreground">{t("roadmap.nextStepHint")}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform group-hover:translate-x-1">
            {t("roadmap.nextStepCta")}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
