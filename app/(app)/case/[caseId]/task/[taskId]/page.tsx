"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Check, CircleDot, ListChecks, MapPin, PlayCircle, RotateCcw } from "lucide-react";
import { CategoryIcon, DeadlineChip, StatusBadge } from "@/components/roadmap/shared";
import { DocGenerator } from "@/components/case/DocGenerator";
import { CourtFeeEstimator } from "@/components/case/CourtFeeEstimator";
import { VoiceButton } from "@/components/shared/VoiceButton";
import { DisclaimerNote } from "@/components/shared/Disclaimer";
import { CaseNotFound } from "@/components/case/CaseNotFound";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCases } from "@/lib/store/CasesProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { DOC_LABELS } from "@/lib/docLabels";
import type { DocType, TaskStatus } from "@/types";

export default function TaskPage({
  params,
}: {
  params: Promise<{ caseId: string; taskId: string }>;
}) {
  const { caseId, taskId } = use(params);
  const t = useT();
  const { getCase, ready, updateTask } = useCases();
  const c = getCase(caseId);

  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-10" aria-busy />;
  if (!c) return <CaseNotFound />;
  const task = c.tasks.find((x) => x.id === taskId);
  if (!task) return <CaseNotFound />;

  const heldDocs = new Set(c.documents.map((d) => d.docType));
  const setStatus = (status: TaskStatus) => updateTask(caseId, taskId, { status });
  const spokenText = [task.title, task.guidance, ...(task.steps ?? [])].join(". ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/case/${caseId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("task.backToRoadmap")}
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-start gap-4">
          <CategoryIcon category={task.category} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <DeadlineChip deadline={task.deadline} />
              <Badge variant="outline">{t(`categories.${task.category}`)}</Badge>
            </div>
            <h1 className="mt-2 font-serif text-2xl font-semibold leading-tight sm:text-3xl">
              {task.title}
            </h1>
          </div>
        </div>

        {/* Status controls */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {task.status !== "done" && task.status !== "blocked" && (
            <>
              {task.status !== "in_progress" && (
                <Button size="sm" variant="outline" onClick={() => setStatus("in_progress")}>
                  <PlayCircle className="h-4 w-4" />
                  {t("task.markInProgress")}
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setStatus("done")}>
                <Check className="h-4 w-4" />
                {t("task.markDone")}
              </Button>
            </>
          )}
          {task.status === "done" && (
            <Button size="sm" variant="ghost" onClick={() => setStatus("todo")}>
              <RotateCcw className="h-4 w-4" />
              {t("task.markTodo")}
            </Button>
          )}
          <VoiceButton text={spokenText} />
        </div>

        {/* Why it matters / guidance */}
        <Card title={t("task.whyItMatters")}>
          <p className="leading-relaxed text-foreground/85">{task.guidance}</p>
        </Card>

        {/* Steps */}
        {task.steps && task.steps.length > 0 && (
          <Card title={t("task.steps")} icon={<ListChecks className="h-4 w-4 text-primary" />}>
            <ol className="space-y-3">
              {task.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/85">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Required docs */}
        {task.requiredDocs.length > 0 && (
          <Card title={t("task.requiredDocs")}>
            <ul className="space-y-2">
              {task.requiredDocs.map((docType) => (
                <DocChecklistRow key={docType} docType={docType} have={heldDocs.has(docType)} />
              ))}
            </ul>
            <Link
              href={`/case/${caseId}/documents`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("vault.title")} →
            </Link>
          </Card>
        )}

        {/* Where to go */}
        {task.institution && (
          <Card title={t("task.institution")} icon={<MapPin className="h-4 w-4 text-accent" />}>
            <p className="text-sm text-foreground/85">{task.institution}</p>
          </Card>
        )}

        {/* Court-fee estimator for succession tasks */}
        {task.category === "succession" && (
          <div className="mt-5">
            <CourtFeeEstimator
              defaultState={c.deceased.domicileState}
              defaultValue={c.assets.reduce((sum, a) => sum + (a.approxValue ?? 0), 0) || undefined}
            />
          </div>
        )}

        {/* Document generator */}
        <div className="mt-5">
          <DocGenerator task={task} c={c} />
        </div>

        <div className="mt-5">
          <DisclaimerNote />
        </div>
      </motion.div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function DocChecklistRow({ docType, have }: { docType: DocType; have: boolean }) {
  const t = useT();
  return (
    <li className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5">
      <span className="flex items-center gap-2.5 text-sm">
        {have ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <CircleDot className="h-4 w-4 text-muted-foreground" />
        )}
        {DOC_LABELS[docType] ?? docType}
      </span>
      <Badge variant={have ? "success" : "outline"}>{have ? t("task.haveIt") : t("task.needIt")}</Badge>
    </li>
  );
}
