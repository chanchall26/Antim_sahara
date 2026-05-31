"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Lock } from "lucide-react";
import { CATEGORY_META, DeadlineChip, StatusBadge } from "./shared";
import { useT } from "@/lib/i18n/I18nProvider";
import type { CaseTask } from "@/types";

export function TaskCard({
  task,
  caseId,
  index,
  isLast,
}: {
  task: CaseTask;
  caseId: string;
  index: number;
  isLast?: boolean;
}) {
  const t = useT();
  const blocked = task.status === "blocked";
  const done = task.status === "done";
  const meta = CATEGORY_META[task.category];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="relative flex gap-4"
    >
      {/* Timeline rail — the category icon is the node, connected by a line */}
      <div className="relative flex shrink-0 flex-col items-center pt-1">
        <span
          className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl ${meta.bg} ${meta.tone} ${
            done ? "ring-2 ring-success/40" : ""
          }`}
          style={done ? undefined : { boxShadow: `0 0 0 4px color-mix(in srgb, var(${meta.cssVar}) 10%, transparent)` }}
        >
          <Icon className="h-6 w-6" />
        </span>
        {!isLast && (
          <span className="timeline-line absolute left-1/2 top-[3.25rem] bottom-[-1.4rem] w-0.5 -translate-x-1/2 rounded-full" />
        )}
      </div>

      {/* Card */}
      <Link
        href={`/case/${caseId}/task/${task.id}`}
        style={{ borderLeftColor: done ? "var(--success)" : `var(${meta.cssVar})` }}
        className={`card-craft lift group mb-1 flex flex-1 gap-3 rounded-2xl border-l-[5px] p-4 sm:p-5 ${
          done ? "opacity-75" : ""
        }`}
      >
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
          <h3
            className={`mt-2 font-medium leading-snug ${
              done ? "text-muted-foreground line-through decoration-success/40" : "text-foreground"
            }`}
          >
            {task.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          {task.institution && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <span className={`h-1.5 w-1.5 rounded-full ${meta.tone} dot-glow`} />
              {task.institution}
            </p>
          )}
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
