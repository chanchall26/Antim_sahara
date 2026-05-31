/**
 * Demo seed — a fictional persona so the full flow runs instantly with DEMO_MODE,
 * no API keys, no live calls. "Load demo case" on the dashboard uses this.
 */
import type { Asset, Deceased, EstateCase, Heir } from "@/types";
import { makeId } from "@/lib/utils";
import { buildPlan } from "@/lib/agents/orchestrator";
import { computeSummary, recomputeBlocking } from "@/lib/store/caseLogic";

export const DEMO_DECEASED: Deceased = {
  name: "Late Shri Ramesh Kumar Sharma",
  dob: "1955-07-14",
  dod: "2026-05-20", // recent, so the 21-day registration deadline is live in the demo
  religion: "hindu",
  domicileState: "Madhya Pradesh",
  hadWill: false,
};

export const DEMO_HEIRS: Heir[] = [
  { id: makeId("h"), name: "Sushila Devi Sharma", relationship: "spouse", isClaimant: true, hasNOC: false },
  { id: makeId("h"), name: "Anil Sharma", relationship: "son", isClaimant: true, hasNOC: false },
  { id: makeId("h"), name: "Priya Sharma", relationship: "daughter", isClaimant: false, hasNOC: true },
];

export function demoAssets(): Asset[] {
  return [
    {
      id: makeId("as"),
      type: "bank_account",
      institution: "State Bank of India",
      identifier: "XXXXXX4821",
      approxValue: 600000,
      hasNominee: false,
    },
    {
      id: makeId("as"),
      type: "insurance",
      institution: "Life Insurance Corporation of India",
      identifier: "XXXX9087",
      approxValue: 300000,
      hasNominee: true,
      nomineeName: "Sushila Devi Sharma",
    },
    {
      id: makeId("as"),
      type: "epf",
      institution: "EPFO",
      employerName: "Bharat Textiles Pvt Ltd",
      approxValue: 450000,
      hasNominee: true,
      nomineeName: "Sushila Devi Sharma",
    },
    {
      id: makeId("as"),
      type: "mutual_fund",
      institution: "HDFC Mutual Fund",
      identifier: "XXXX2231",
      approxValue: 180000,
      hasNominee: false,
    },
  ];
}

/** Build a complete, ready-to-explore demo case for the given owner. */
export function buildDemoCase(ownerUid: string): EstateCase {
  const assets = demoAssets();
  const { tasks, notes } = buildPlan({
    deceased: DEMO_DECEASED,
    assets,
    relationshipToDeceased: "son",
  });
  // Pre-complete the registration step so the demo shows real progress + unblocking.
  const seededTasks = tasks.map((t) =>
    t.category === "registration" ? { ...t, status: "done" as const } : t,
  );
  const finalTasks = recomputeBlocking(seededTasks);
  const now = Date.now();
  return {
    id: makeId("case"),
    ownerUid,
    deceased: DEMO_DECEASED,
    relationshipToDeceased: "son",
    status: "active",
    createdAt: now,
    updatedAt: now,
    heirs: DEMO_HEIRS,
    assets,
    tasks: finalTasks,
    documents: [
      {
        id: makeId("doc"),
        docType: "death_certificate",
        fileName: "death-certificate-ramesh-sharma.pdf",
        isGenerated: false,
        createdAt: now,
        extracted: {
          deceasedName: "Ramesh Kumar Sharma",
          dateOfDeath: "2026-05-20",
          dateOfBirth: "1955-07-14",
          place: "Gwalior, Madhya Pradesh",
          registrationNo: "MP/GWL/2026/004821",
          fatherOrSpouseName: "Sushila Devi Sharma",
          confidence: 0.94,
        },
      },
    ],
    advisorNotes: notes,
    summary: computeSummary(finalTasks),
  };
}
