"use client";

import { use } from "react";
import { HeartHandshake } from "lucide-react";
import { CaseHeader } from "@/components/case/CaseHeader";
import { CaseTabs } from "@/components/case/CaseTabs";
import { DocumentJourney } from "@/components/case/DocumentJourney";
import { CaseNotFound } from "@/components/case/CaseNotFound";
import { DisclaimerNote } from "@/components/shared/Disclaimer";
import { useCases } from "@/lib/store/CasesProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function GuidePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const t = useT();
  const { getCase, ready } = useCases();
  const c = getCase(caseId);

  if (!ready) return <div className="mx-auto max-w-5xl px-4 py-10" aria-busy />;
  if (!c) return <CaseNotFound />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="space-y-5">
        <CaseHeader c={c} />
        <CaseTabs caseId={caseId} />
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">{t("guide.intro")}</p>
      </div>

      <DocumentJourney c={c} />

      <div className="mt-6">
        <DisclaimerNote />
      </div>
    </div>
  );
}
