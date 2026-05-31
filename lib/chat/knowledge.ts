/**
 * Knowledge base for the Saathi companion (the "R" in RAG).
 *
 * Each chunk is a small, self-contained, quotable unit of guidance drawn from the
 * same deterministic sources as the roadmap engine (see lib/succession/rules.ts and
 * lib/config.ts), so the chatbot can never drift from the app's actual advice.
 *
 * GUIDANCE ONLY — every figure mirrors a CONFIG constant marked "// VERIFY".
 */
import { CONFIG } from "@/lib/config";
import type { TaskCategory } from "@/types";

export type KnowledgeCategory = TaskCategory | "general" | "documents" | "emotional";

export interface KnowledgeChunk {
  id: string;
  title: string;
  category: KnowledgeCategory;
  /** Retrieval keywords + common synonyms (incl. a little Hinglish). */
  tags: string[];
  /** A calm one-or-two sentence answer. */
  summary: string;
  /** Short, actionable "what to do" lines. */
  points?: string[];
  /** Where to go (office / portal). */
  where?: string;
}

const L = (n: number) => `₹${(n / 100000).toLocaleString("en-IN")} lakh`;

export const KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: "first-steps",
    title: "Where to begin",
    category: "general",
    tags: [
      "start", "begin", "first", "step", "next", "what", "do", "where", "order", "priority",
      "overwhelmed", "confused", "lost", "shuru", "pehla", "kya", "karna", "kaise",
    ],
    summary:
      "The very first step is always the death certificate — almost every claim depends on it. After that, the claims can move in parallel: bank, provident fund, insurance, mutual funds, and succession papers.",
    points: [
      "Step 1 — Register the death and collect several certified copies.",
      "Step 2 — Gather the claimant's ID (Aadhaar, PAN) and any passbooks or policy bonds.",
      "Step 3 — Open each claim (bank, EPFO, insurance) — they can run at the same time.",
      "Step 4 — Arrange succession papers only if an asset has no nominee and crosses a threshold.",
    ],
    where: "Your roadmap orders all of this for you — start with the highlighted next step.",
  },
  {
    id: "registration",
    title: "Registering the death",
    category: "registration",
    tags: [
      "register", "registration", "death", "certificate", "crs", "municipal", "panchayat",
      "form", "21", "days", "panjikaran", "praman", "patra", "mrityu",
    ],
    summary: `Register the death within ${CONFIG.DEATH_REGISTRATION_DAYS} days — within this window it is free. The death certificate is the single most-reused document, so ask for several certified copies.`,
    points: [
      "Collect the Medical Certificate of Cause of Death (Form 4, or Form 4A for a home death).",
      "Submit the death report (Form 2) with the deceased's and informant's ID.",
      "Register within 21 days at the municipal body / panchayat, or online at crsorgi.gov.in.",
      "Ask for 5–10 certified copies — the digitally signed PDF is legally valid.",
    ],
    where: "Local Municipal / Panchayat Registrar, or crsorgi.gov.in.",
  },
  {
    id: "bank-nominee",
    title: "Bank account with a nominee",
    category: "bank",
    tags: [
      "bank", "account", "deposit", "savings", "fd", "nominee", "survivor", "sbi", "paisa",
      "khata", "money", "balance", "fixed",
    ],
    summary:
      "If a nominee or an 'either or survivor' holder is on record, the bank pays out on just the claim form, the death certificate and the claimant's ID — no succession certificate, whatever the amount (RBI 2025).",
    points: [
      "Visit the branch or its online claim portal and ask for the deceased-claim form.",
      "Submit the claim form with a death certificate and your own ID proof.",
      `Settlement is generally within about ${CONFIG.BANK_SETTLEMENT_DAYS} days of complete documents.`,
    ],
    where: "The deceased's bank branch or its claims portal.",
  },
  {
    id: "bank-no-nominee",
    title: "Bank account with no nominee",
    category: "bank",
    tags: [
      "bank", "account", "no", "nominee", "without", "succession", "indemnity", "bond", "noc",
      "heir", "threshold", "limit", "deposit", "paisa", "khata",
    ],
    summary: `With no nominee, small balances (up to about ${L(CONFIG.BANK_THRESHOLD_COMMERCIAL)} for commercial banks, ${L(CONFIG.BANK_THRESHOLD_COOPERATIVE)} for co-operative banks) use a simplified route. Above that, a Succession Certificate is usually needed.`,
    points: [
      "Ask the bank for the deceased-claim form set (Annexures I-B to I-E).",
      "Arrange a Legal Heir Certificate or affidavit, an indemnity bond, and an NOC from other heirs.",
      "Submit everything together with the death certificate and IDs.",
      "Antim Sahara can prepare the indemnity bond and NOC drafts for you.",
    ],
    where: "The deceased's bank branch.",
  },
  {
    id: "epfo",
    title: "Provident fund (EPFO)",
    category: "epfo",
    tags: [
      "epf", "epfo", "pf", "provident", "fund", "form", "20", "10d", "5if", "edli", "employer",
      "pension", "naukri", "company",
    ],
    summary: `EPFO benefits are claimed through the last employer. No succession certificate is needed — they use the nomination or legal-heir route. EDLI insurance pays a minimum of ${L(CONFIG.EDLI_MIN)} and up to ${L(CONFIG.EDLI_MAX)}.`,
    points: [
      "Ask the last employer to attest the claim forms.",
      "File Form 20 (PF balance), Form 10D (family pension) and Form 5IF (EDLI insurance).",
      "A Composite Death Claim Form combines all three.",
      "Attach the death certificate, claimant ID and a cancelled cheque.",
    ],
    where: "The deceased's last employer, then the regional EPFO office.",
  },
  {
    id: "insurance",
    title: "Life insurance claim",
    category: "insurance",
    tags: [
      "insurance", "lic", "policy", "bond", "claim", "irdai", "life", "bima", "maturity",
      "sum", "assured", "nominee",
    ],
    summary: `Life-insurance death claims need the claim form, the original policy bond, the death certificate and the claimant's ID/bank proof. IRDAI norms expect settlement within about ${CONFIG.INSURANCE_SETTLEMENT_DAYS} days.`,
    points: [
      "Inform the insurer and request the death-claim form.",
      "Gather the original policy bond, death certificate and claimant ID/bank proof.",
      "Submit and track the claim until it is settled.",
    ],
    where: "The insurer's branch or claims portal (e.g. LIC, a private insurer).",
  },
  {
    id: "mutualfund",
    title: "Mutual funds & shares (transmission)",
    category: "mutualfund",
    tags: [
      "mutual", "fund", "mf", "shares", "demat", "stocks", "securities", "transmission",
      "sebi", "rta", "cams", "kfintech", "nominee", "equity",
    ],
    summary: `Units transmit on a Transmission Request Form. With a nominee, it is quick (~7 working days). Without one, simplified transmission applies up to about ${L(CONFIG.SEBI_THRESHOLD_PHYSICAL)} per physical issuer / ${L(CONFIG.SEBI_THRESHOLD_DEMAT)} per demat account.`,
    points: [
      "Submit a Transmission Request Form to the fund house / RTA (CAMS or KFintech).",
      "Attach an attested death certificate and the nominee's or claimant's KYC.",
      "Above the threshold with no nominee, a Succession Certificate is generally required.",
    ],
    where: "The fund house, depository participant, or the RTA (CAMS / KFintech).",
  },
  {
    id: "succession-certificate",
    title: "Succession Certificate",
    category: "succession",
    tags: [
      "succession", "certificate", "court", "district", "debts", "securities", "petition",
      "370", "390", "uttaradhikar", "praman",
    ],
    summary:
      "A Succession Certificate is granted by the District Court (Indian Succession Act ss.370–390) for the deceased's debts and securities — bank deposits, shares and mutual funds above the simplified thresholds. It does not cover immovable property.",
    points: [
      "File a petition in the District Court with the death certificate and heir details.",
      "The court issues a newspaper notice (about 30–45 days) before granting.",
      "Court fees are an ad-valorem percentage that varies by state.",
      "It usually takes a few months, so start it early if a large asset needs it.",
    ],
    where: "The District Court where the deceased lived.",
  },
  {
    id: "legal-heir-certificate",
    title: "Legal Heir Certificate",
    category: "succession",
    tags: [
      "legal", "heir", "certificate", "tahsildar", "sdm", "revenue", "pension", "varisu",
      "warisan", "vaible",
    ],
    summary:
      "A Legal Heir Certificate is an administrative document from the Tahsildar / SDM. It is quicker than a Succession Certificate (about 15–30 days) and is used for pension, provident fund and small claims.",
    points: [
      "Apply at the Tahsildar / SDM (revenue) office with the death certificate.",
      "List all legal heirs and attach IDs.",
      "Use it for EPFO, pension and bank/share claims within the simplified thresholds.",
    ],
    where: "The Tahsildar / SDM (revenue) office in your area.",
  },
  {
    id: "probate-will",
    title: "Wills and probate",
    category: "succession",
    tags: [
      "will", "probate", "executor", "vasiyat", "testament", "loa", "letters", "administration",
      "mumbai", "chennai", "kolkata",
    ],
    summary:
      "If there is a will, a court-certified copy (probate) authorises the executor to administer the estate. Probate is mandatory in the Mumbai, Chennai and Kolkata jurisdictions; elsewhere banks may act on an undisputed will. Keep the original safe.",
    points: [
      "Locate the original will and identify the named executor.",
      "File a probate petition in the District / High Court with the death certificate.",
      "Respond to the court's public notice; pay court fees on the grant.",
    ],
    where: "The District / High Court with jurisdiction.",
  },
  {
    id: "heir-shares",
    title: "Who inherits (class of heirs)",
    category: "succession",
    tags: [
      "heir", "inherit", "share", "divide", "who", "gets", "class", "spouse", "son", "daughter",
      "wife", "husband", "children", "hindu", "muslim", "christian", "parsi", "hissa", "batwara",
    ],
    summary:
      "Who inherits depends on the personal law. Under the Hindu Succession Act, Class I heirs (spouse, sons, daughters, mother) inherit equally; daughters are coparceners since 2005. Muslim, Christian and Parsi succession each follow their own fixed shares.",
    points: [
      "Hindu/Buddhist/Jain/Sikh: Class I heirs share equally and at the same time.",
      "Muslim: sharers and residuaries take fixed fractions; up to 1/3 may be willed.",
      "Christian: spouse usually 1/3 and children 2/3 (Indian Succession Act s.33).",
      "Parsi: widow/widower and each child take equal shares.",
    ],
  },
  {
    id: "unclaimed",
    title: "Tracing unclaimed money",
    category: "unclaimed",
    tags: [
      "unclaimed", "owed", "lost", "forgotten", "udgam", "rbi", "bima", "bharosa", "iepf",
      "dividend", "shares", "deposit", "trace", "search", "missing", "paisa",
    ],
    summary: `Large sums sit unclaimed across banks, insurers and shares. You can search for money that may belong to your family on the RBI's UDGAM portal, IRDAI's Bima Bharosa, and recover shares via Form IEPF-5.`,
    points: [
      "Search UDGAM (udgam.rbi.org.in) with the deceased's name / PAN for bank deposits.",
      "Search Bima Bharosa (bimabharosa.irdai.gov.in) for forgotten insurance policies.",
      "For shares/dividends moved to the IEPF, complete transmission then file Form IEPF-5.",
    ],
    where: "UDGAM (RBI) · Bima Bharosa (IRDAI) · IEPF portal.",
  },
  {
    id: "documents",
    title: "Documents you'll need",
    category: "documents",
    tags: [
      "document", "documents", "papers", "need", "checklist", "certificate", "aadhaar", "pan",
      "passbook", "cheque", "id", "proof", "kya", "chahiye", "kagaz", "dastavej",
    ],
    summary:
      "A small set of documents is reused across almost every claim: the death certificate, the claimant's Aadhaar and PAN, and the deceased's passbook or policy bond. Upload each once and Antim Sahara reuses it everywhere it's needed.",
    points: [
      "Death certificate — the master document for every claim.",
      "Claimant's Aadhaar and PAN — your identity and tax proof.",
      "Passbook / cancelled cheque — for the account that will receive funds.",
      "Policy bond, will, or nomination papers — if they exist.",
    ],
    where: "Your Document Vault keeps these together and reuses them.",
  },
  {
    id: "court-fees",
    title: "Court fees & costs",
    category: "succession",
    tags: [
      "court", "fee", "fees", "cost", "stamp", "charge", "expensive", "money", "kharcha", "ad",
      "valorem",
    ],
    summary:
      "Court fees for a Succession Certificate are an ad-valorem percentage of the asset value and vary by state, often with a cap. A Legal Heir Certificate is far cheaper. Antim Sahara has a court-fee estimator on succession tasks.",
    points: [
      "Fees scale with the value of the debts/securities covered.",
      "Each state sets its own percentage and any maximum.",
      "Use the estimator on the succession step for a rough figure — then verify locally.",
    ],
  },
  {
    id: "emotional",
    title: "A gentle pause",
    category: "emotional",
    tags: [
      "sad", "grief", "grieving", "tired", "cope", "hard", "difficult", "alone", "scared",
      "cry", "miss", "help", "dukh", "thak", "akela", "pain", "loss",
    ],
    summary:
      "Grief and paperwork arriving together is unbearably heavy, and it's okay to move slowly. You don't have to do any of this in one day — and you don't have to do it alone. I'll keep the next step small and clear whenever you're ready.",
    points: [
      "There is no deadline today except the death registration window — everything else can breathe.",
      "Do one small thing, then rest. Progress is progress.",
      "Lean on family to share the visits and calls where you can.",
    ],
  },
];

export const KNOWLEDGE_BY_ID: Record<string, KnowledgeChunk> = Object.fromEntries(
  KNOWLEDGE.map((k) => [k.id, k]),
);
