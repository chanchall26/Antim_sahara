/**
 * ANTIM SAHARA — core domain types.
 * Mirrors the Firestore data model (see firestore.rules + docs/build_spec §6).
 */

export type Religion = "hindu" | "muslim" | "christian" | "parsi" | "other";

export type Relationship =
  | "spouse"
  | "son"
  | "daughter"
  | "parent"
  | "sibling"
  | "grandchild"
  | "other";

export type AssetType =
  | "bank_account"
  | "epf"
  | "insurance"
  | "mutual_fund"
  | "demat"
  | "property"
  | "pension"
  | "other";

export type TaskCategory =
  | "registration"
  | "bank"
  | "epfo"
  | "insurance"
  | "mutualfund"
  | "succession"
  | "unclaimed"
  | "pension";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type DocType =
  | "death_certificate"
  | "aadhaar"
  | "pan"
  | "legal_heir_cert"
  | "passbook"
  | "policy_bond"
  | "affidavit"
  | "indemnity_bond"
  | "noc"
  | "succession_cert"
  | "generated_letter";

export interface AppUser {
  uid: string;
  displayName?: string;
  phone?: string;
  email?: string;
  preferredLanguage: string;
  isDemo?: boolean;
  createdAt: number;
}

export interface Deceased {
  name: string;
  dob?: string;
  dod?: string;
  religion: Religion;
  domicileState: string;
  hadWill: boolean;
  photoUrl?: string;
}

export interface Heir {
  id: string;
  name: string;
  relationship: Relationship;
  share?: string;
  isClaimant: boolean;
  hasNOC: boolean;
}

export interface Asset {
  id: string;
  type: AssetType;
  institution: string;
  identifier?: string; // stored masked
  approxValue?: number;
  hasNominee: boolean;
  nomineeName?: string;
  jointHolder?: boolean;
  employerName?: string; // for EPF
}

export interface CaseTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  dependencies: string[];
  requiredDocs: DocType[];
  deadline?: string | null;
  institution?: string;
  generatedDocIds: string[];
  guidance: string;
  /** Plain-language "why this matters" + steps, optionally AI-enriched. */
  steps?: string[];
  assetId?: string;
  /** "now" = needs attention, "later" = can wait. */
  priority?: "now" | "later";
}

export interface CaseDocument {
  id: string;
  docType: DocType;
  storagePath?: string;
  fileName: string;
  mimeType?: string;
  /** Structured fields extracted by the DocumentParser agent. */
  extracted?: Record<string, unknown>;
  isGenerated: boolean;
  dataUrl?: string; // demo-mode inline storage
  createdAt: number;
}

export interface CaseSummary {
  totalTasks: number;
  doneTasks: number;
  blockedTasks: number;
}

export interface EstateCase {
  id: string;
  ownerUid: string;
  deceased: Deceased;
  relationshipToDeceased: Relationship;
  status: "active" | "completed";
  createdAt: number;
  updatedAt: number;
  summary: CaseSummary;
  heirs: Heir[];
  assets: Asset[];
  tasks: CaseTask[];
  documents: CaseDocument[];
  /** AI/advisor narrative shown on the roadmap. */
  advisorNotes?: AdvisorNote[];
}

export interface AdvisorNote {
  assetId?: string;
  category: TaskCategory;
  /** The instrument required: nominee route / legal heir cert / succession cert / probate / LoA. */
  instrument: string;
  reason: string;
  heirClass?: string;
}

/* ---------- Agent I/O contracts ---------- */

export interface DeathCertExtract {
  deceasedName: string;
  dateOfDeath?: string;
  dateOfBirth?: string;
  place?: string;
  registrationNo?: string;
  fatherOrSpouseName?: string;
  confidence: number;
}

export interface AgentActivityStep {
  agent: string;
  label: string;
  status: "pending" | "running" | "done";
}
