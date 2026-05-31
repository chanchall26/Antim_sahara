"use client";

import { use, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { CaseTabs } from "@/components/case/CaseTabs";
import { CaseNotFound } from "@/components/case/CaseNotFound";
import { DisclaimerNote } from "@/components/shared/Disclaimer";
import { Button } from "@/components/ui/button";
import { useCases } from "@/lib/store/CasesProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { runUnclaimed, type UnclaimedItem } from "@/lib/agents/client";

export default function UnclaimedPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const t = useT();
  const { getCase, ready } = useCases();
  const c = getCase(caseId);
  const [packet, setPacket] = useState<UnclaimedItem[] | null>(null);

  useEffect(() => {
    if (!c) return;
    runUnclaimed({
      deceasedName: c.deceased.name,
      hasBank: c.assets.some((a) => a.type === "bank_account"),
      hasInsurance: c.assets.some((a) => a.type === "insurance"),
      hasShares: c.assets.some((a) => a.type === "demat" || a.type === "mutual_fund"),
    })
      .then((r) => setPacket(r.packet))
      .catch(() => setPacket([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, ready]);

  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-10" aria-busy />;
  if (!c) return <CaseNotFound />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <CaseTabs caseId={caseId} />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Search className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold">{t("unclaimed.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("unclaimed.subtitle")}</p>
          </div>
        </div>

        {packet === null ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <div className="space-y-4">
            {packet.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-lg font-semibold leading-tight">{item.title}</h2>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      {t("unclaimed.openPortal")}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.why}</p>
                <ol className="mt-3 space-y-2">
                  {item.steps.map((step, j) => (
                    <li key={j} className="flex gap-2.5 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                        {j + 1}
                      </span>
                      <span className="text-foreground/85">{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
            <DisclaimerNote />
          </div>
        )}
      </motion.div>
    </div>
  );
}
