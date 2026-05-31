"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Download, FileText, Loader2, Sparkles, Upload, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/I18nProvider";
import { useCases } from "@/lib/store/CasesProvider";
import { DOC_LABELS } from "@/lib/docLabels";
import { runParseDocument, fileToBase64 } from "@/lib/agents/client";
import { makeId } from "@/lib/utils";
import type { CaseDocument, DocType, EstateCase } from "@/types";

const UPLOADABLE: DocType[] = [
  "death_certificate",
  "aadhaar",
  "pan",
  "legal_heir_cert",
  "passbook",
  "policy_bond",
  "succession_cert",
];

export function DocVault({ c }: { c: EstateCase }) {
  const t = useT();
  const { addDocument } = useCases();
  const [docType, setDocType] = useState<DocType>("death_certificate");
  const [busy, setBusy] = useState(false);

  // How many tasks require each docType — powers the "reused in N claims" line.
  const reuseCount = (dt: DocType) =>
    c.tasks.filter((task) => task.requiredDocs.includes(dt)).length;

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const { data, mimeType } = await fileToBase64(file);
      let extracted: Record<string, unknown> | undefined;
      if (docType === "death_certificate") {
        try {
          const res = await runParseDocument({ data, mimeType, docType });
          extracted = res.extracted as unknown as Record<string, unknown>;
        } catch {
          /* non-fatal */
        }
      }
      addDocument(c.id, {
        id: makeId("doc"),
        docType,
        fileName: file.name,
        mimeType,
        dataUrl: `data:${mimeType};base64,${data}`,
        isGenerated: false,
        extracted,
        createdAt: Date.now(),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label>{t("vault.uploadDoc")}</Label>
            <Select value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
              {UPLOADABLE.map((dt) => (
                <option key={dt} value={dt}>
                  {DOC_LABELS[dt]}
                </option>
              ))}
            </Select>
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-base font-medium text-primary-foreground shadow-sm transition-all hover:brightness-110">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {t("common.upload")}
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              disabled={busy}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {/* List */}
      {c.documents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
          {t("vault.noDocs")}
        </p>
      ) : (
        <div className="space-y-3">
          {c.documents.map((doc, i) => (
            <DocRow key={doc.id} doc={doc} index={i} reuse={reuseCount(doc.docType)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocRow({ doc, index, reuse }: { doc: CaseDocument; index: number; reuse: number }) {
  const t = useT();
  const extracted = doc.extracted as Record<string, string | number> | undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            doc.isGenerated ? "bg-secondary-soft text-secondary" : "bg-primary-soft text-primary"
          }`}
        >
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{DOC_LABELS[doc.docType] ?? doc.docType}</h3>
            {doc.isGenerated ? (
              <Badge variant="secondary">
                <Sparkles className="h-3 w-3" />
                {t("vault.generated")}
              </Badge>
            ) : (
              <Badge variant="neutral">
                <UserCheck className="h-3 w-3" />
                {t("vault.uploaded")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{doc.fileName}</p>
          {reuse > 0 && (
            <p className="mt-1.5 text-xs text-secondary">{t("vault.reusedIn", { n: reuse })}</p>
          )}

          {/* Extracted fields */}
          {extracted && (
            <div className="mt-3 rounded-xl bg-muted/50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-success" />
                {t("vault.extractedFields")}
              </p>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                {Object.entries(extracted)
                  .filter(([k]) => k !== "confidence")
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="capitalize text-muted-foreground">
                        {k.replace(/([A-Z])/g, " $1").toLowerCase()}
                      </dt>
                      <dd className="text-right font-medium text-foreground">{String(v)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}
        </div>

        {doc.dataUrl && (
          <a href={doc.dataUrl} download={doc.fileName} aria-label={t("common.download")}>
            <Button size="icon" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        )}
      </div>
    </motion.div>
  );
}
