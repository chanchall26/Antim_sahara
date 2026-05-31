"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, HeartHandshake, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/misc";
import { useCases } from "@/lib/store/CasesProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { progressPercent } from "@/lib/store/caseLogic";
import { buildDemoCase } from "@/lib/demo/seed";
import type { EstateCase } from "@/types";

export default function DashboardPage() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { cases, ready, upsertCase } = useCases();

  const loadDemo = () => {
    if (!user) return;
    const demo = buildDemoCase(user.uid);
    upsertCase(demo);
    router.push(`/case/${demo.id}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <h1 className="font-serif text-3xl font-semibold">{t("dashboard.title")}</h1>
          <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/onboarding">
          <Button size="lg" variant="gradient">
            <Plus className="h-5 w-5" />
            {t("dashboard.createCase")}
          </Button>
        </Link>
      </motion.div>

      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState onDemo={loadDemo} onCreate={() => router.push("/onboarding")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cases.map((c, i) => (
            <CaseCard key={c.id} c={c} index={i} />
          ))}
          <DemoTile onDemo={loadDemo} />
        </div>
      )}
    </div>
  );
}

function CaseCard({ c, index }: { c: EstateCase; index: number }) {
  const t = useT();
  const pct = progressPercent(c.summary);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        href={`/case/${c.id}`}
        className="card-craft lift group flex items-center gap-5 rounded-2xl p-5"
      >
        <ProgressRing value={pct} label={`${pct}%`} sublabel={t("status.done")} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("dashboard.forWhom")}
          </p>
          <h3 className="truncate font-serif text-lg font-semibold leading-tight">
            {c.deceased.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="primary">
              {t("dashboard.progress", { done: c.summary.doneTasks, total: c.summary.totalTasks })}
            </Badge>
            {c.status === "completed" && <Badge variant="success">{t("status.done")}</Badge>}
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}

function DemoTile({ onDemo }: { onDemo: () => void }) {
  const t = useT();
  return (
    <button
      onClick={onDemo}
      className="flex items-center gap-4 rounded-2xl border border-dashed border-secondary/40 bg-secondary-soft/40 p-5 text-left transition-colors hover:bg-secondary-soft"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-medium">{t("dashboard.loadDemo")}</h3>
        <p className="text-xs text-muted-foreground">{t("dashboard.demoNote")}</p>
      </div>
    </button>
  );
}

function EmptyState({ onDemo, onCreate }: { onDemo: () => void; onCreate: () => void }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft text-primary">
        <HeartHandshake className="h-7 w-7" />
      </div>
      <h2 className="font-serif text-2xl font-semibold">{t("dashboard.noCasesTitle")}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {t("dashboard.noCasesBody")}
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={onCreate}>
          <Plus className="h-5 w-5" />
          {t("dashboard.createCase")}
        </Button>
        <Button size="lg" variant="secondary" onClick={onDemo}>
          <Sparkles className="h-5 w-5" />
          {t("dashboard.loadDemo")}
        </Button>
      </div>
    </motion.div>
  );
}
