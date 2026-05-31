/**
 * Certificate-first "step-by-step" guide.
 *
 * Given the documents a family already holds, this turns the case's roadmap into an
 * ordered walk — Step 1 to the end — that says, for each step, WHERE to go and WHAT to
 * do, and whether they're ready for it or still waiting on an earlier step / a document.
 *
 * Deterministic and key-free: it reuses the tasks the orchestrator already produced
 * (which encode the dependency order, steps, institution and required docs).
 */
import { DOC_LABELS } from "@/lib/docLabels";
import type { CaseTask, DocType, EstateCase } from "@/types";

/** Documents a family typically holds or collects (the checklist offers these). */
export const GUIDE_DOC_TYPES: DocType[] = [
  "death_certificate",
  "aadhaar",
  "pan",
  "passbook",
  "policy_bond",
  "legal_heir_cert",
  "succession_cert",
];

/** Docs that Antim Sahara can draft for the family, so they never block a step. */
const PREPARABLE: DocType[] = ["indemnity_bond", "noc", "affidavit", "generated_letter"];

/** IDs the living claimant almost always has — used to seed the checklist sensibly. */
export const ASSUMED_HELD: DocType[] = ["aadhaar", "pan"];

export type StepStatus = "done" | "ready" | "blocked";

export interface JourneyStep {
  id: string;
  taskId: string;
  n: number;
  title: string;
  category: CaseTask["category"];
  where: string;
  what: string[];
  /** Documents to bring that the family must hold/collect themselves. */
  bring: DocType[];
  /** Documents Antim Sahara can prepare for them. */
  prepare: DocType[];
  /** Document this step yields (e.g. the death or legal-heir certificate). */
  produces?: DocType;
  status: StepStatus;
  blockedReason?: string;
}

/** The artifact a step yields, so later steps can depend on it. */
function producesDoc(task: CaseTask): DocType | undefined {
  if (task.category === "registration") return "death_certificate";
  if (task.category === "succession") return "legal_heir_cert";
  return undefined;
}

const labels = (docs: DocType[]) => docs.map((d) => DOC_LABELS[d] ?? d).join(", ");

/** Build the ordered journey from the case + the set of held documents. */
export function buildJourney(c: EstateCase, owned: Set<DocType>): JourneyStep[] {
  const held = new Set(owned);
  // Earliest step number that yields each document, filled as we walk in order.
  const producedBy: Partial<Record<DocType, number>> = {};

  return c.tasks.map((task, i) => {
    const n = i + 1;
    const produces = producesDoc(task);
    const required = task.requiredDocs;
    const bring = required.filter((d) => d !== produces && !PREPARABLE.includes(d));
    const prepare = required.filter((d) => PREPARABLE.includes(d));
    const missing = bring.filter((d) => !held.has(d));

    let status: StepStatus;
    let blockedReason: string | undefined;
    if ((produces && held.has(produces)) || task.status === "done") {
      status = "done";
    } else if (missing.length === 0) {
      status = "ready";
    } else {
      status = "blocked";
      const earlierSteps = [
        ...new Set(missing.map((d) => producedBy[d]).filter((x): x is number => x != null)),
      ].sort((a, b) => a - b);
      const gather = missing.filter((d) => producedBy[d] == null);
      const reasons: string[] = [];
      if (earlierSteps.length) {
        reasons.push(
          earlierSteps.length === 1
            ? `Complete step ${earlierSteps[0]} first.`
            : `Complete steps ${earlierSteps.join(" & ")} first.`,
        );
      }
      if (gather.length) reasons.push(`First obtain: ${labels(gather)}.`);
      blockedReason = reasons.join(" ");
    }

    // Record what this step yields for the steps that follow it.
    if (produces && producedBy[produces] == null) producedBy[produces] = n;

    return {
      id: `step_${task.id}`,
      taskId: task.id,
      n,
      title: task.title,
      category: task.category,
      where: task.institution ?? "",
      what: task.steps ?? [],
      bring,
      prepare,
      produces,
      status,
      blockedReason,
    };
  });
}

export interface JourneySummary {
  total: number;
  done: number;
  ready: number;
  blocked: number;
  nextReady?: JourneyStep;
}

export function summarise(steps: JourneyStep[]): JourneySummary {
  return {
    total: steps.length,
    done: steps.filter((s) => s.status === "done").length,
    ready: steps.filter((s) => s.status === "ready").length,
    blocked: steps.filter((s) => s.status === "blocked").length,
    nextReady: steps.find((s) => s.status === "ready"),
  };
}

/* ---------- persistence (per case, localStorage — demo-first) ---------- */

const ownedKey = (caseId: string) => `antim.guide.owned.${caseId}`;

/** Load the held-document set, seeding from the case + assumed IDs on first visit. */
export function loadOwnedDocs(caseId: string, seed: DocType[]): DocType[] {
  const base = Array.from(new Set<DocType>([...seed, ...ASSUMED_HELD]));
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(ownedKey(caseId));
    if (raw) return JSON.parse(raw) as DocType[];
  } catch {
    /* ignore */
  }
  return base;
}

export function saveOwnedDocs(caseId: string, docs: DocType[]) {
  try {
    localStorage.setItem(ownedKey(caseId), JSON.stringify(docs));
  } catch {
    /* ignore quota */
  }
}
