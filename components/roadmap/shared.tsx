"use client";

import {
  Banknote,
  Briefcase,
  Clock,
  FileSignature,
  HeartHandshake,
  Landmark,
  PiggyBank,
  Search,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/I18nProvider";
import { daysUntil } from "@/lib/utils";
import type { TaskCategory, TaskStatus } from "@/types";

export const CATEGORY_META: Record<
  TaskCategory,
  { icon: LucideIcon; tone: string; bg: string; cssVar: string }
> = {
  registration: { icon: FileSignature, tone: "text-info", bg: "bg-info-soft", cssVar: "--info" },
  bank: { icon: Landmark, tone: "text-primary", bg: "bg-primary-soft", cssVar: "--primary" },
  epfo: { icon: Briefcase, tone: "text-secondary", bg: "bg-secondary-soft", cssVar: "--secondary" },
  insurance: { icon: ShieldCheck, tone: "text-accent", bg: "bg-accent-soft", cssVar: "--accent" },
  mutualfund: { icon: TrendingUp, tone: "text-primary", bg: "bg-primary-soft", cssVar: "--primary" },
  succession: { icon: FileSignature, tone: "text-info", bg: "bg-info-soft", cssVar: "--info" },
  unclaimed: { icon: Search, tone: "text-accent", bg: "bg-accent-soft", cssVar: "--gold" },
  pension: { icon: PiggyBank, tone: "text-secondary", bg: "bg-secondary-soft", cssVar: "--secondary" },
};

export function CategoryIcon({ category, className }: { category: TaskCategory; className?: string }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span
      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${meta.bg} ${meta.tone} ${className ?? ""}`}
    >
      <Icon className="h-6 w-6" />
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const t = useT();
  const variant =
    status === "done" ? "success" : status === "in_progress" ? "info" : status === "blocked" ? "neutral" : "outline";
  return <Badge variant={variant as never}>{t(`status.${status}`)}</Badge>;
}

export function DeadlineChip({ deadline }: { deadline?: string | null }) {
  const t = useT();
  if (!deadline) return null;
  const days = daysUntil(deadline);
  if (days == null) return null;

  let variant: "danger" | "warning" | "neutral" = "neutral";
  let label: string;
  if (days < 0) {
    variant = "danger";
    label = t("roadmap.overdueBy", { days: Math.abs(days) });
  } else if (days === 0) {
    variant = "warning";
    label = t("roadmap.dueToday");
  } else if (days <= 7) {
    variant = "warning";
    label = t("roadmap.deadlineIn", { days });
  } else {
    label = t("roadmap.deadlineIn", { days });
  }
  return (
    <Badge variant={variant}>
      <Clock className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export { HeartHandshake, Banknote };
