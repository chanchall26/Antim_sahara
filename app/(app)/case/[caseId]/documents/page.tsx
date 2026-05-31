"use client";

import { use } from "react";
import { motion } from "motion/react";
import { CaseTabs } from "@/components/case/CaseTabs";
import { DocVault } from "@/components/case/DocVault";
import { CaseNotFound } from "@/components/case/CaseNotFound";
import { useCases } from "@/lib/store/CasesProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function DocumentsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const t = useT();
  const { getCase, ready } = useCases();
  const c = getCase(caseId);

  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-10" aria-busy />;
  if (!c) return <CaseNotFound />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <CaseTabs caseId={caseId} />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <h1 className="font-serif text-2xl font-semibold">{t("vault.title")}</h1>
        <p className="mb-6 mt-1.5 text-sm text-muted-foreground">{t("vault.subtitle")}</p>
        <DocVault c={c} />
      </motion.div>
    </div>
  );
}
