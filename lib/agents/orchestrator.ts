/**
 * Orchestrator / Planner agent (deterministic core).
 * Turns case facts + advisor notes into an ordered, dependency-aware roadmap.
 * Works with zero API keys; Gemini only enriches the prose (see successionAdvisor.ts).
 */
import { makeId } from "@/lib/utils";
import { CONFIG } from "@/lib/config";
import { buildAdvice, INSTRUMENT } from "@/lib/succession/rules";
import type {
  AdvisorNote,
  Asset,
  CaseTask,
  Deceased,
  DocType,
  TaskCategory,
} from "@/types";

export interface PlanInput {
  deceased: Deceased;
  assets: Asset[];
  relationshipToDeceased: string;
}

export interface PlanResult {
  tasks: CaseTask[];
  notes: AdvisorNote[];
}

/** Add N days to a date string, return ISO date (yyyy-mm-dd) or null. */
function addDays(dateStr: string | undefined, days: number): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const assetLabel: Record<Asset["type"], string> = {
  bank_account: "bank account",
  epf: "provident fund",
  insurance: "insurance policy",
  mutual_fund: "mutual fund",
  demat: "shares / demat",
  property: "property",
  pension: "pension",
  other: "asset",
};

function docsForCategory(category: TaskCategory, instrument: string): DocType[] {
  const base: DocType[] = ["death_certificate", "aadhaar"];
  switch (category) {
    case "bank":
      if (instrument === INSTRUMENT.NOMINEE) return [...base];
      return [...base, "indemnity_bond", "noc", "legal_heir_cert"];
    case "epfo":
      return [...base, "pan"];
    case "insurance":
      return [...base, "policy_bond"];
    case "mutualfund":
      if (instrument === INSTRUMENT.NOMINEE) return [...base];
      return [...base, "indemnity_bond", "noc"];
    case "succession":
      return [...base, "legal_heir_cert"];
    case "pension":
      return [...base, "legal_heir_cert"];
    default:
      return base;
  }
}

function stepsForAsset(asset: Asset, note: AdvisorNote): string[] {
  switch (asset.type) {
    case "bank_account":
      return note.instrument === INSTRUMENT.NOMINEE
        ? [
            `Visit the ${asset.institution} branch (or its online claim portal).`,
            "Submit the claim form with the death certificate and your ID proof.",
            "The bank settles the account to the nominee within about 15 days (RBI 2025).",
          ]
        : [
            `Ask ${asset.institution} for the deceased-claim form set (Annexures I-B to I-E).`,
            "Arrange a Legal Heir Certificate or affidavit, an indemnity bond, and an NOC from other heirs.",
            "Submit everything together with the death certificate and IDs.",
            "Settlement is generally within 15 days of complete documents.",
          ];
    case "epf":
      return [
        `Approach ${asset.employerName || asset.institution || "the last employer"} to attest the claim forms.`,
        "File Form 20 (PF balance), Form 10D (family pension) and Form 5IF (EDLI insurance) — a Composite Death Claim Form combines them.",
        "Attach the death certificate, claimant ID and a cancelled cheque.",
      ];
    case "insurance":
      return [
        `Inform ${asset.institution} of the claim and request the death-claim form.`,
        "Gather the original policy bond, death certificate and claimant ID/bank proof.",
        "Submit and track — IRDAI norms expect settlement within ~30 days.",
      ];
    case "mutual_fund":
    case "demat":
      return note.instrument === INSTRUMENT.NOMINEE
        ? [
            `Submit a Transmission Request Form to ${asset.institution} (or its RTA — CAMS/KFintech).`,
            "Attach an attested death certificate and the nominee's KYC (PAN, CML/CMR).",
            "Transmission usually completes in about 7 working days.",
          ]
        : [
            `Request the transmission form from ${asset.institution}/the RTA.`,
            "Provide a Legal Heir Certificate, affidavit, indemnity bond and NOC from co-heirs.",
            "Submit with the death certificate; expect a few weeks to process.",
          ];
    case "pension":
      return [
        "Submit the family-pension form to the pension-sanctioning authority/bank.",
        "Attach the death certificate and a Legal Heir Certificate.",
        "Begin annual Jeevan Pramaan (digital life certificate) for the family pensioner.",
      ];
    default:
      return ["Confirm the exact process with the holding institution."];
  }
}

export function buildPlan(input: PlanInput): PlanResult {
  const { deceased, assets } = input;
  const notes = buildAdvice(deceased, assets);
  const tasks: CaseTask[] = [];

  // 1) Death registration — always first, the gateway document.
  const regId = makeId("t");
  tasks.push({
    id: regId,
    title: "Register the death & collect the certificate",
    description:
      "The death certificate is the single most-reused document — every claim depends on it. Register within 21 days (free).",
    category: "registration",
    status: "todo",
    dependencies: [],
    requiredDocs: ["aadhaar"],
    deadline: addDays(deceased.dod, CONFIG.DEATH_REGISTRATION_DAYS),
    institution: "Municipal/Panchayat Registrar or crsorgi.gov.in",
    generatedDocIds: [],
    priority: "now",
    guidance:
      "Register at the local municipal body/panchayat or on the CRS portal (crsorgi.gov.in). Hospitals issue the Medical Certificate of Cause of Death (Form 4); for home deaths use Form 4A. Registration within 21 days is free. Ask for several certified copies — you will reuse them across every claim.",
    steps: [
      "Collect the Medical Certificate of Cause of Death (Form 4 / 4A).",
      "Submit the death report (Form 2) with the deceased's and informant's ID.",
      "Register within 21 days — it is free within this window.",
      "Request 5–10 certified copies; the digital signed PDF is legally valid.",
    ],
  });

  // 2) Succession instrument task, if any asset needs a court/revenue instrument.
  const needsInstrument = notes.some((n) =>
    [INSTRUMENT.SUCCESSION_CERT, INSTRUMENT.PROBATE, INSTRUMENT.LOA, INSTRUMENT.LEGAL_HEIR_CERT].includes(
      n.instrument as never,
    ),
  );
  let successionId: string | null = null;
  if (needsInstrument) {
    successionId = makeId("t");
    const instrument = deceased.hadWill ? INSTRUMENT.PROBATE : INSTRUMENT.SUCCESSION_CERT;
    tasks.push({
      id: successionId,
      title: deceased.hadWill
        ? "Apply for probate of the will"
        : "Obtain the right succession document",
      description: deceased.hadWill
        ? "A court-certified will (probate) authorises the executor to administer the estate."
        : "Decide between a Legal Heir Certificate (administrative) and a Succession Certificate (court, for debts & securities).",
      category: "succession",
      status: "todo",
      dependencies: [regId],
      requiredDocs: ["death_certificate", "legal_heir_cert"],
      deadline: null,
      institution: deceased.hadWill ? "District/High Court" : "District Court / Tahsildar",
      generatedDocIds: [],
      priority: "later",
      guidance:
        heirClassNote(deceased) +
        " A Legal Heir Certificate (from the Tahsildar/SDM) is quick (~15–30 days) and used for pension/PF; a Succession Certificate (District Court, Indian Succession Act ss.370–390) is for bank deposits, shares and mutual funds and takes a few months. Court fees are an ad-valorem percentage that varies by state.",
      steps: deceased.hadWill
        ? [
            "Locate the original will and identify the executor.",
            "File a probate petition in the District/High Court with the death certificate.",
            "Respond to the court's public notice; pay court fees on grant.",
          ]
        : [
            "For pension/PF: apply for a Legal Heir Certificate at the Tahsildar/SDM office.",
            "For bank/shares above thresholds: file a Succession Certificate petition in the District Court.",
            "The court issues a newspaper notice (~30–45 days) before granting.",
          ],
    });
  }

  // 3) Per-asset claim tasks.
  for (const asset of assets) {
    const note = notes.find((n) => n.assetId === asset.id);
    if (!note) continue;
    const category = note.category;
    const needsSuccession = [
      INSTRUMENT.SUCCESSION_CERT,
      INSTRUMENT.PROBATE,
      INSTRUMENT.LOA,
    ].includes(note.instrument as never);

    const deps = [regId];
    if (needsSuccession && successionId) deps.push(successionId);

    tasks.push({
      id: makeId("t"),
      title: `Claim the ${assetLabel[asset.type]} — ${asset.institution}`,
      description: `Route: ${note.instrument}.`,
      category,
      status: "todo",
      dependencies: deps,
      requiredDocs: docsForCategory(category, note.instrument),
      deadline:
        category === "insurance" ? addDays(deceased.dod, CONFIG.INSURANCE_SETTLEMENT_DAYS) : null,
      institution: asset.institution,
      generatedDocIds: [],
      assetId: asset.id,
      priority: note.instrument === INSTRUMENT.NOMINEE ? "now" : "later",
      guidance: note.reason,
      steps: stepsForAsset(asset, note),
    });
  }

  // 4) Trace unclaimed money — always offered, can wait.
  tasks.push({
    id: makeId("t"),
    title: "Trace any unclaimed money owed to the family",
    description:
      "Crores of rupees sit unclaimed across banks, insurers and shares. Check what may belong to your family.",
    category: "unclaimed",
    status: "todo",
    dependencies: [regId],
    requiredDocs: ["death_certificate", "pan"],
    deadline: null,
    institution: "UDGAM (RBI) · Bima Bharosa (IRDAI) · IEPF",
    generatedDocIds: [],
    priority: "later",
    guidance:
      "Search RBI's UDGAM portal for unclaimed bank deposits, IRDAI's Bima Bharosa for forgotten policies, and file IEPF-5 for shares/dividends moved to the IEPF. Antim Sahara can build a search packet for you.",
    steps: [
      "Search UDGAM (udgam.rbi.org.in) with the deceased's name/PAN.",
      "Search Bima Bharosa (bimabharosa.irdai.gov.in) for unclaimed policies.",
      "If shares/dividends moved to IEPF, complete transmission then file Form IEPF-5.",
    ],
  });

  return { tasks, notes };
}

function heirClassNote(deceased: Deceased): string {
  const note = buildAdvice(deceased, []).find((n) => n.category === "succession");
  return note?.heirClass ?? "";
}
