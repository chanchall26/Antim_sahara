"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Lock } from "lucide-react";
import { CATEGORY_META, CategoryIcon, DeadlineChip, StatusBadge } from "./shared";
import { useT } from "@/lib/i18n/I18nProvider";
import type { CaseTask } from "@/types";

export function TaskCard({ task, caseId, index }: { task: CaseTask; caseId: string; index: number }) {
  const t = useT();
  const blocked = task.status === "blocked";
  const done = task.status === "done";
  const meta = CATEGORY_META[task.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
    >
      <Link
        href={`/case/${caseId}/task/${task.id}`}
        style={{ borderLeftColor: done ? "var(--success)" : `var(${meta.cssVar})` }}
        className={`group flex gap-4 rounded-2xl border border-l-[6px] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-5 ${
          done ? "bg-success-soft/40" : "bg-card hover:bg-muted/30"
        }`}
      >
        <CategoryIcon category={task.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <DeadlineChip deadline={task.deadline} />
            {blocked && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                {t("roadmap.blockedBy")}
              </span>
            )}
          </div>
          <h3 className={`mt-2 font-medium leading-snug ${done ? "text-muted-foreground line-through decoration-success/40" : "text-foreground"}`}>
            {task.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          {task.institution && (
            <p className="mt-2 text-xs text-muted-foreground/80">{task.institution}</p>
          )}
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
