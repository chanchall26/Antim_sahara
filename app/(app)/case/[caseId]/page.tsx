"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, ChevronDown, Clock3, PartyPopper } from "lucide-react";
import { CaseHeader } from "@/components/case/CaseHeader";
import { CaseTabs } from "@/components/case/CaseTabs";
import { TaskCard } from "@/components/roadmap/TaskCard";
import { NextStep } from "@/components/roadmap/NextStep";
import { AgentActivityPanel } from "@/components/roadmap/AgentActivity";
import { DisclaimerNote } from "@/components/shared/Disclaimer";
import { CaseNotFound } from "@/components/case/CaseNotFound";
import { Button } from "@/components/ui/button";
import { useCases } from "@/lib/store/CasesProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { splitByPriority } from "@/lib/store/caseLogic";
import type { CaseTask } from "@/types";

export default function RoadmapPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const t = useT();
  const { getCase, ready } = useCases();
  const c = getCase(caseId);

  if (!ready) return <div className="mx-auto max-w-5xl px-4 py-10" aria-busy />;
  if (!c) return <CaseNotFound />;

  const { now, later, done } = splitByPriority(c.tasks);
  const allDone = c.tasks.length > 0 && c.tasks.every((task) => task.status === "done");

  // The single "do this first" task: earliest-deadline actionable task, else first actionable.
  const actionable = [...now, ...later].filter((x) => x.status !== "blocked");
  const nextStep =
    [...actionable].sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return da - db;
    })[0] ?? null;
  const nowList = now.filter((x) => x.id !== nextStep?.id);
  const laterList = later.filter((x) => x.id !== nextStep?.id);

  // Parallel claim tracks = the distinct open financial categories (the "agentic" story).
  const tracks = Array.from(
    new Set(now.concat(later).filter((x) => x.category !== "registration").map((x) => x.category)),
  ).map((cat) => t(`categories.${cat}`));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="space-y-5">
        <CaseHeader c={c} />
        <CaseTabs caseId={caseId} />
      </div>

      {allDone ? (
        <AllDone />
      ) : (
        <>
          {nextStep && (
            <div className="mt-6">
              <NextStep task={nextStep} caseId={caseId} />
            </div>
          )}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <Section
              icon={<AlertCircle className="h-5 w-5 text-accent" />}
              title={t("roadmap.needsNow")}
              sub={t("roadmap.needsNowSub")}
              tasks={nowList}
              caseId={caseId}
            />
            <Section
              icon={<Clock3 className="h-5 w-5 text-secondary" />}
              title={t("roadmap.canWait")}
              sub={t("roadmap.canWaitSub")}
              tasks={laterList}
              caseId={caseId}
              collapsible
            />
            {done.length > 0 && (
              <DoneSection tasks={done} caseId={caseId} title={t("status.done")} />
            )}
            <DisclaimerNote />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <AgentActivityPanel parallelTracks={tracks} />
            <Link href={`/case/${caseId}/unclaimed`}>
              <Button variant="outline" className="w-full">
                {t("unclaimed.title")}
              </Button>
            </Link>
          </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  sub,
  tasks,
  caseId,
  collapsible,
  emptyHint,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  tasks: CaseTask[];
  caseId: string;
  collapsible?: boolean;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(true);
  if (tasks.length === 0 && !emptyHint) return null;

  return (
    <section>
      <button
        onClick={() => collapsible && setOpen((o) => !o)}
        className="mb-3 flex w-full items-center gap-2.5 text-left"
        aria-expanded={open}
      >
        {icon}
        <div className="flex-1">
          <h2 className="font-serif text-xl font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        {collapsible && (
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {tasks.length === 0 ? (
              <p className="rounded-xl bg-success-soft/50 p-4 text-sm text-success">{emptyHint}</p>
            ) : (
              tasks.map((task, i) => <TaskCard key={task.id} task={task} caseId={caseId} index={i} />)
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DoneSection({ tasks, caseId, title }: { tasks: CaseTask[]; caseId: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen((o) => !o)} className="mb-3 flex w-full items-center gap-2.5" aria-expanded={open}>
        <CheckCircle2 className="h-5 w-5 text-success" />
        <h2 className="flex-1 text-left font-serif text-xl font-semibold">
          {title} <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span>
        </h2>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} caseId={caseId} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function AllDone() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-6 rounded-3xl border border-success/30 bg-success-soft/50 p-10 text-center"
    >
      <PartyPopper className="mx-auto mb-4 h-10 w-10 text-success" />
      <h2 className="font-serif text-2xl font-semibold">{t("roadmap.allDoneTitle")}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {t("roadmap.allDoneBody")}
      </p>
    </motion.div>
  );
}
