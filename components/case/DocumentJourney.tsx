"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  CircleCheckBig,
  Clock3,
  MapPin,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { DOC_LABELS } from "@/lib/docLabels";
import {
  buildJourney,
  GUIDE_DOC_TYPES,
  loadOwnedDocs,
  saveOwnedDocs,
  summarise,
  type JourneyStep,
} from "@/lib/guide/documentGuide";
import type { DocType, EstateCase } from "@/types";

export function DocumentJourney({ c }: { c: EstateCase }) {
  const t = useT();
  const [owned, setOwned] = useState<DocType[]>(() =>
    loadOwnedDocs(c.id, c.documents.map((d) => d.docType)),
  );

  const toggle = (doc: DocType) => {
    setOwned((prev) => {
      const next = prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc];
      saveOwnedDocs(c.id, next);
      return next;
    });
  };

  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const steps = useMemo(() => buildJourney(c, ownedSet), [c, ownedSet]);
  const summary = useMemo(() => summarise(steps), [steps]);

  return (
    <div className="mt-6 space-y-6">
      {/* Stage A — certificate checklist */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-serif text-xl font-semibold leading-tight">{t("guide.checklistTitle")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("guide.checklistSub")}</p>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GUIDE_DOC_TYPES.map((doc) => {
            const active = ownedSet.has(doc);
            return (
              <button
                key={doc}
                type="button"
                onClick={() => toggle(doc)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-all",
                  active
                    ? "border-primary bg-primary-soft text-primary shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
                {DOC_LABELS[doc]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Summary banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary-soft/50 p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {t("guide.haveCount", { have: owned.length, total: GUIDE_DOC_TYPES.length })}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.nextReady
              ? t("guide.nextReady", { title: summary.nextReady.title })
              : summary.blocked > 0
                ? t("guide.gatherMore")
                : t("guide.allReady")}
          </p>
        </div>
      </div>

      {/* Stage B — the ordered path */}
      <section>
        <h2 className="mb-1 font-serif text-xl font-semibold leading-tight">{t("guide.stepsTitle")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("guide.stepsSub")}</p>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <StepCard key={step.id} step={step} caseId={c.id} index={i} ownedSet={ownedSet} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StepCard({
  step,
  caseId,
  index,
  ownedSet,
}: {
  step: JourneyStep;
  caseId: string;
  index: number;
  ownedSet: Set<DocType>;
}) {
  const t = useT();
  const tone =
    step.status === "done"
      ? { ring: "border-success/30", chip: "success" as const, label: t("guide.done") }
      : step.status === "ready"
        ? { ring: "border-primary/30", chip: "primary" as const, label: t("guide.ready") }
        : { ring: "border-border", chip: "neutral" as const, label: t("guide.blocked") };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm sm:p-5",
        tone.ring,
        step.status === "blocked" && "opacity-90",
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Number / status marker */}
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            step.status === "done"
              ? "bg-success-soft text-success"
              : step.status === "ready"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground",
          )}
        >
          {step.status === "done" ? <CircleCheckBig className="h-5 w-5" /> : step.n}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium leading-tight">{step.title}</h3>
            <Badge variant={tone.chip}>{tone.label}</Badge>
          </div>

          {/* Blocked reason */}
          {step.status === "blocked" && step.blockedReason && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              {step.blockedReason}
            </p>
          )}

          {/* Where to go */}
          {step.where && (
            <p className="mt-2.5 flex items-start gap-1.5 text-sm text-foreground/85">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                <span className="font-medium text-muted-foreground">{t("guide.where")}: </span>
                {step.where}
              </span>
            </p>
          )}

          {/* What to do */}
          {step.what.length > 0 && (
            <ol className="mt-2.5 space-y-1.5">
              {step.what.map((line, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                  <span className="mt-0.5 text-xs font-semibold text-primary">{j + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          )}

          {/* Documents to bring */}
          {step.bring.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {step.bring.map((doc) => {
                const have = ownedSet.has(doc);
                return (
                  <Badge key={doc} variant={have ? "success" : "outline"}>
                    {have ? <Check className="h-3 w-3" /> : null}
                    {DOC_LABELS[doc]}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* What Antim Sahara prepares */}
          {step.prepare.length > 0 && (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-secondary">
              <WandSparkles className="h-3.5 w-3.5 shrink-0" />
              {t("guide.willPrepare")}: {step.prepare.map((d) => DOC_LABELS[d]).join(", ")}
            </p>
          )}

          {/* What you'll receive */}
          {step.produces && step.status !== "done" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("guide.produces")}: {DOC_LABELS[step.produces]}
            </p>
          )}

          <Link
            href={`/case/${caseId}/task/${step.taskId}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t("guide.openStep")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
