"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  HeartHandshake,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DisclaimerBadge } from "@/components/shared/Disclaimer";
import { AgentBuilding } from "@/components/roadmap/AgentActivity";
import { useT, useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCases } from "@/lib/store/CasesProvider";
import { makeId, maskIdentifier } from "@/lib/utils";
import {
  ASSET_TYPE_OPTIONS,
  INDIAN_STATES,
  NOMINEE_RELEVANT,
  RELATIONSHIP_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/constants";
import { runOrchestrate, runParseDocument, fileToBase64 } from "@/lib/agents/client";
import { DOC_LABELS } from "@/lib/docLabels";
import { GUIDE_DOC_TYPES, saveOwnedDocs } from "@/lib/guide/documentGuide";
import type { Asset, AssetType, Deceased, DocType, Relationship, Religion } from "@/types";

const TOTAL = 6;

interface DraftAsset {
  id: string;
  type: AssetType;
  institution: string;
  identifier: string;
  approxValue: string;
  hasNominee: boolean;
}

export function IntakeWizard() {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { createCase, applyCase } = useCasesBridge();

  const [step, setStep] = useState(1);
  const [building, setBuilding] = useState(false);

  // Step state
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [dod, setDod] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("son");
  const [religion, setReligion] = useState<Religion>("hindu");
  const [state, setState] = useState("");
  const [hadWill, setHadWill] = useState<boolean | null>(null);
  const [assets, setAssets] = useState<DraftAsset[]>([]);
  const [ownedDocs, setOwnedDocs] = useState<DocType[]>([]);
  const [certFile, setCertFile] = useState<File | null>(null);

  const toggleDoc = (doc: DocType) =>
    setOwnedDocs((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));

  const canNext = (() => {
    if (step === 1) return name.trim().length > 1 && !!dod;
    if (step === 3) return !!state && hadWill !== null;
    return true;
  })();

  const addAsset = () =>
    setAssets((a) => [
      ...a,
      { id: makeId("as"), type: "bank_account", institution: "", identifier: "", approxValue: "", hasNominee: false },
    ]);
  const updateAsset = (id: string, patch: Partial<DraftAsset>) =>
    setAssets((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeAsset = (id: string) => setAssets((a) => a.filter((x) => x.id !== id));

  const finish = async () => {
    if (!user) return;
    setBuilding(true);

    const deceased: Deceased = {
      name: name.trim(),
      dob: dob || undefined,
      dod: dod || undefined,
      religion,
      domicileState: state,
      hadWill: hadWill ?? false,
    };
    const cleanAssets: Asset[] = assets
      .filter((a) => a.institution.trim())
      .map((a) => ({
        id: a.id,
        type: a.type,
        institution: a.institution.trim(),
        identifier: a.identifier ? maskIdentifier(a.identifier) : undefined,
        approxValue: a.approxValue ? Number(a.approxValue) : undefined,
        hasNominee: a.hasNominee,
      }));

    // Optional: parse the death certificate.
    let extracted: Record<string, unknown> | undefined;
    if (certFile) {
      try {
        const { data, mimeType } = await fileToBase64(certFile);
        const res = await runParseDocument({ data, mimeType, docType: "death_certificate" });
        extracted = res.extracted as unknown as Record<string, unknown>;
        if (!deceased.dod && res.extracted.dateOfDeath) deceased.dod = res.extracted.dateOfDeath;
      } catch {
        /* non-fatal */
      }
    }

    // Build the case + run the orchestrator.
    const created = createCase({ deceased, relationshipToDeceased: relationship, assets: cleanAssets });

    // Seed the step-by-step guide with the documents the family told us they have.
    const seededDocs = certFile
      ? [...new Set<DocType>([...ownedDocs, "death_certificate"])]
      : ownedDocs;
    saveOwnedDocs(created.id, seededDocs);
    try {
      const { tasks, notes } = await runOrchestrate({
        deceased,
        assets: cleanAssets,
        relationshipToDeceased: relationship,
        language: locale,
      });
      applyCase(created.id, tasks, notes, certFile?.name, extracted);
    } catch {
      // Even if the API fails, the deterministic plan can be built client-side as a fallback.
      const { buildPlan } = await import("@/lib/agents/orchestrator");
      const { tasks, notes } = buildPlan({ deceased, assets: cleanAssets, relationshipToDeceased: relationship });
      applyCase(created.id, tasks, notes, certFile?.name, extracted);
    }

    // A gentle pause so the "building" agents animation is felt, not skipped.
    setTimeout(() => router.push(`/case/${created.id}`), 2600);
  };

  if (building) return <AgentBuilding hasCert={!!certFile} />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            {t("onboarding.stepLabel", { n: step, total: TOTAL })}
          </span>
          <DisclaimerBadge />
        </div>
        <Progress value={(step / TOTAL) * 100} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 1 && (
            <StepShell title={t("onboarding.q1Title")} sub={t("onboarding.q1Sub")}>
              <Field label={t("onboarding.nameLabel")}>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("onboarding.namePlaceholder")} autoFocus />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t("onboarding.dobLabel")} (${t("common.optional")})`}>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </Field>
                <Field label={t("onboarding.dodLabel")}>
                  <Input type="date" value={dod} onChange={(e) => setDod(e.target.value)} />
                </Field>
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title={t("onboarding.q2Title")} sub={t("onboarding.q2Sub")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <ChoiceChip key={r} active={relationship === r} onClick={() => setRelationship(r)}>
                    {t(`relationships.${r}`)}
                  </ChoiceChip>
                ))}
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title={t("onboarding.q3Title")} sub={t("onboarding.q3Sub")}>
              <Field label={t("onboarding.religionLabel")}>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {RELIGION_OPTIONS.map((r) => (
                    <ChoiceChip key={r} active={religion === r} onClick={() => setReligion(r)} align="left">
                      {t(`religions.${r}`)}
                    </ChoiceChip>
                  ))}
                </div>
              </Field>
              <Field label={t("onboarding.stateLabel")}>
                <Select value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="" disabled>
                    {t("onboarding.statePlaceholder")}
                  </option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("onboarding.willLabel")}>
                <div className="flex gap-3">
                  <ChoiceChip active={hadWill === true} onClick={() => setHadWill(true)} className="flex-1">
                    {t("common.yes")}
                  </ChoiceChip>
                  <ChoiceChip active={hadWill === false} onClick={() => setHadWill(false)} className="flex-1">
                    {t("common.no")}
                  </ChoiceChip>
                  <ChoiceChip active={false} onClick={() => setHadWill(false)} className="flex-1">
                    {t("common.notSure")}
                  </ChoiceChip>
                </div>
              </Field>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title={t("onboarding.q4Title")} sub={t("onboarding.q4Sub")}>
              <div className="space-y-3">
                {assets.length === 0 && (
                  <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
                    {t("onboarding.noAssetsYet")}
                  </p>
                )}
                {assets.map((a) => (
                  <AssetRow
                    key={a.id}
                    asset={a}
                    onChange={(patch) => updateAsset(a.id, patch)}
                    onRemove={() => removeAsset(a.id)}
                  />
                ))}
                <Button variant="soft" className="w-full" onClick={addAsset}>
                  <Plus className="h-4 w-4" />
                  {t("onboarding.addAsset")}
                </Button>
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title={t("onboarding.docsHaveTitle")} sub={t("onboarding.docsHaveSub")}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GUIDE_DOC_TYPES.map((doc) => {
                  const active = ownedDocs.includes(doc);
                  return (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => toggleDoc(doc)}
                      aria-pressed={active}
                      className={[
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                        active
                          ? "border-primary bg-primary-soft text-primary shadow-sm"
                          : "border-border bg-card text-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        ].join(" ")}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                      </span>
                      {DOC_LABELS[doc]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{t("onboarding.docsHaveHint")}</p>
            </StepShell>
          )}

          {step === 6 && (
            <StepShell title={t("onboarding.q5Title")} sub={t("onboarding.q5Sub")}>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-10 text-center transition-colors hover:bg-muted">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium">
                  {certFile ? certFile.name : t("onboarding.uploadCert")}
                </span>
                <span className="text-xs text-muted-foreground">{t("onboarding.certHelp")}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {certFile && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-success">
                  <Check className="h-4 w-4" /> {certFile.name}
                </p>
              )}
            </StepShell>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        ) : (
          <span />
        )}
        {step < TOTAL ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            {t("common.next")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" variant="gradient" onClick={finish}>
            <HeartHandshake className="h-5 w-5" />
            {t("onboarding.finishCta")}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- pieces ---------- */

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sub}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ChoiceChip({
  children,
  active,
  onClick,
  className,
  align = "center",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-3 text-sm font-medium transition-all",
        align === "left" ? "text-left" : "text-center",
        active
          ? "border-primary bg-primary-soft text-primary shadow-sm"
          : "border-border bg-card text-foreground hover:bg-muted",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function AssetRow({
  asset,
  onChange,
  onRemove,
}: {
  asset: DraftAsset;
  onChange: (p: Partial<DraftAsset>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {t(`assetTypes.${asset.type}`)}
        </span>
        <button onClick={onRemove} className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger" aria-label={t("common.remove")}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Select value={asset.type} onChange={(e) => onChange({ type: e.target.value as AssetType })}>
          {ASSET_TYPE_OPTIONS.map((tp) => (
            <option key={tp} value={tp}>
              {t(`assetTypes.${tp}`)}
            </option>
          ))}
        </Select>
        <Input
          value={asset.institution}
          onChange={(e) => onChange({ institution: e.target.value })}
          placeholder={t("onboarding.institutionPlaceholder")}
        />
        <Input
          value={asset.approxValue}
          onChange={(e) => onChange({ approxValue: e.target.value.replace(/[^\d]/g, "") })}
          placeholder={`${t("onboarding.approxValue")} (₹)`}
          inputMode="numeric"
        />
        {NOMINEE_RELEVANT.includes(asset.type) ? (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4">
            <input
              type="checkbox"
              checked={asset.hasNominee}
              onChange={(e) => onChange({ hasNominee: e.target.checked })}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="text-sm">{t("onboarding.hasNominee")}</span>
          </label>
        ) : (
          <span />
        )}
      </div>
    </motion.div>
  );
}

/** Bridges the wizard to the store with a convenient applyCase that also stores the cert doc. */
function useCasesBridge() {
  const { createCase, applyPlan, addDocument } = useCases();
  return {
    createCase,
    applyCase: (
      caseId: string,
      tasks: Parameters<typeof applyPlan>[1],
      notes: Parameters<typeof applyPlan>[2],
      certName?: string,
      extracted?: Record<string, unknown>,
    ) => {
      applyPlan(caseId, tasks, notes);
      if (certName) {
        addDocument(caseId, {
          id: makeId("doc"),
          docType: "death_certificate",
          fileName: certName,
          isGenerated: false,
          createdAt: Date.now(),
          extracted,
        });
      }
    },
  };
}
