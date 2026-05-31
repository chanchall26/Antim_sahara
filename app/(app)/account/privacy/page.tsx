"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { History, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useCases } from "@/lib/store/CasesProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { PRIVACY_SUMMARY } from "@/lib/legal";
import { HAS_FIREBASE } from "@/lib/config";

export default function PrivacyPage() {
  const t = useT();
  const router = useRouter();
  const { audit, eraseAll } = useCases();
  const [confirm, setConfirm] = useState(false);

  const doErase = () => {
    eraseAll();
    setConfirm(false);
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-soft text-secondary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold">{t("privacy.title")}</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("privacy.body")}</p>
          </div>
        </div>

        {/* Safeguards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Safeguard icon={<Lock className="h-4 w-4" />} label="Encrypted in transit & at rest" />
          <Safeguard icon={<History className="h-4 w-4" />} label="Every access is logged" />
          <Safeguard icon={<Trash2 className="h-4 w-4" />} label="Erase everything anytime" />
        </div>

        <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
          {PRIVACY_SUMMARY}
          {!HAS_FIREBASE && " In this build your data stays on this device only (no server)."}
        </p>

        {/* Audit log */}
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <History className="h-4 w-4" />
            {t("privacy.auditTitle")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {audit.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="divide-y divide-border">
                {audit.slice(0, 30).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="font-mono text-xs text-foreground/80">{entry.action}</span>
                    <span className="flex items-center gap-3">
                      {entry.detail && (
                        <span className="truncate text-xs text-muted-foreground">{entry.detail}</span>
                      )}
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {new Date(entry.at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Erase */}
        <section className="mt-8 rounded-2xl border border-danger/30 bg-danger-soft/40 p-5">
          <h2 className="font-semibold text-danger">{t("privacy.erase")}</h2>
          <p className="mt-1 text-sm text-foreground/80">{t("privacy.eraseConfirm")}</p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirm(true)}>
            <Trash2 className="h-4 w-4" />
            {t("privacy.erase")}
          </Button>
        </section>
      </motion.div>

      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <h2 className="font-serif text-xl font-semibold">{t("privacy.erase")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("privacy.eraseConfirm")}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={doErase}>
            <Trash2 className="h-4 w-4" />
            {t("privacy.erase")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function Safeguard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-soft text-secondary">
        {icon}
      </span>
      <span className="text-xs font-medium text-foreground/85">{label}</span>
    </div>
  );
}
