"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/I18nProvider";
import { useCases } from "@/lib/store/CasesProvider";
import { templatesForCategory } from "@/lib/templates";
import { runGenerateDoc } from "@/lib/agents/client";
import { makeId } from "@/lib/utils";
import type { CaseTask, EstateCase } from "@/types";
import type { TemplateVars } from "@/lib/templates/types";

interface GeneratedDoc {
  fileName: string;
  title: string;
  dataUrl: string;
  docId: string;
}

export function DocGenerator({ task, c }: { task: CaseTask; c: EstateCase }) {
  const t = useT();
  const { addDocument, updateTask } = useCases();
  const templates = templatesForCategory(task.category);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [doc, setDoc] = useState<GeneratedDoc | null>(null);

  if (templates.length === 0) return null;

  const asset = task.assetId ? c.assets.find((a) => a.id === task.assetId) : undefined;

  const generate = async (templateKey: string) => {
    setBusyKey(templateKey);
    setDoc(null);
    const claimant = c.heirs.find((h) => h.isClaimant) ?? c.heirs[0];
    const vars: TemplateVars = {
      deceasedName: c.deceased.name.replace(/^Late\s+(Shri|Smt\.?|Sri)\s+/i, ""),
      dateOfDeath: c.deceased.dod,
      domicileState: c.deceased.domicileState,
      institution: asset?.institution ?? task.institution ?? "the institution",
      accountOrPolicyNo: asset?.identifier,
      approxValue: asset?.approxValue,
      claimantName: claimant?.name ?? "the claimant",
      claimantRelationship: t(`relationships.${c.relationshipToDeceased}`),
      heirs: c.heirs.map((h) => `${h.name} (${t(`relationships.${h.relationship}`)})`),
    };
    try {
      const res = await runGenerateDoc({ templateKey, vars });
      const docId = makeId("doc");
      addDocument(c.id, {
        id: docId,
        docType: (res.docType as never) ?? "generated_letter",
        fileName: res.fileName,
        mimeType: res.mimeType,
        isGenerated: true,
        dataUrl: res.dataUrl,
        createdAt: Date.now(),
      });
      updateTask(c.id, task.id, { generatedDocIds: [...task.generatedDocIds, docId] });
      setDoc({ fileName: res.fileName, title: res.title, dataUrl: res.dataUrl, docId });
    } catch {
      /* ignore; user can retry */
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("task.generateDoc")}</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((tpl) => (
          <Button
            key={tpl.key}
            size="sm"
            variant={busyKey === tpl.key ? "soft" : "outline"}
            onClick={() => generate(tpl.key)}
            disabled={!!busyKey}
          >
            {busyKey === tpl.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {tpl.label}
          </Button>
        ))}
      </div>

      <AnimatePresence>
        {busyKey && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-muted-foreground"
          >
            {t("task.generating")}
          </motion.p>
        )}

        {doc && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                {doc.title}
              </span>
              <a href={doc.dataUrl} download={doc.fileName}>
                <Button size="sm">
                  <Download className="h-4 w-4" />
                  {t("task.downloadPdf")}
                </Button>
              </a>
            </div>
            <object data={doc.dataUrl} type="application/pdf" className="h-[480px] w-full">
              <div className="p-6 text-center text-sm text-muted-foreground">
                <a href={doc.dataUrl} download={doc.fileName} className="text-primary underline">
                  {t("task.downloadPdf")}
                </a>
              </div>
            </object>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-3 text-xs text-muted-foreground">{t("disclaimer.persistent")}</p>
    </div>
  );
}
