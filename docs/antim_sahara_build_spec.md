# ANTIM SAHARA — Claude Code Build Spec (Phased)

> A compassionate, AI-powered "death & estate concierge" for India. After a family member dies, it guides the family step-by-step through death registration, bank/EPFO/insurance/mutual-fund claims, succession documents, and tracing unclaimed money — branching by religion, asset type, nominee status, and language. Built with a multi-agent Gemini system on the Google/Firebase stack.

---

## 0. HOW TO USE THIS DOCUMENT WITH CLAUDE CODE

This is a **phased** build. Do NOT paste the whole thing at once. Work phase by phase:

1. Open Claude Code in an empty folder.
2. Paste **Phase 0 prompt** → let it scaffold + verify it runs.
3. Paste **Phase 1 prompt** → the core working slice (this alone is demo-able and wins).
4. Then Phases 2 → 3 → 4 in order.
5. After each phase, run the app, fix errors, commit to GitHub, then move on.

**Repo name (event rule):** `APL_GWALIOR_<YourTeamName>` — exactly this format.

```
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/<user>/APL_GWALIOR_<TeamName>.git
git branch -M main && git push -u origin main
```

---

## 1. NON-NEGOTIABLE GROUND RULES (tell Claude Code to honor these everywhere)

- **This is guidance, not legal/financial advice.** Every screen that gives legal steps MUST show a persistent disclaimer: *"Antim Sahara provides general guidance, not legal advice. Rules, fees, and thresholds vary by state and institution — please verify with the relevant office."* Add a one-time consent modal on first use.
- **Sensitive data.** Death/financial data is highly sensitive (India DPDP Act 2023). Encrypt in transit + at rest (Firebase does at-rest by default), keep all Gemini/API keys **server-side only** (Next.js route handlers / server actions — never in client bundles), scope Firestore Security Rules to the authenticated owner.
- **Compassionate tone.** Calm, warm, never clinical. Show only the next relevant step + "what can wait." No dark patterns, no urgency manipulation.
- **Demo-mode is mandatory** (see §9): a toggle that serves pre-cached AI outputs + seeded data so the live demo never fails on an API rate-limit.
- **Accessibility:** large tap targets, high contrast, screen-reader labels, simple language, vernacular toggle, voice in/out.

---

## 2. TECH STACK (PRIMARY — recommended for reliable one-shot build)

| Layer | Choice |
|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** |
| Styling | **Tailwind CSS + shadcn/ui** |
| Animation | **Motion** (framer-motion) — gentle, subtle |
| Auth | **Firebase Auth** (phone OTP + email) |
| Database | **Cloud Firestore** |
| File storage | **Firebase Cloud Storage** (document uploads) |
| AI | **Gemini via `@google/genai` SDK** — `gemini-2.5-flash` (multimodal OCR, structured JSON, function-calling). Use `gemini-2.5-pro` for the planner if needed. |
| Agents | **TypeScript orchestrator** in `lib/agents/` (multiple specialized Gemini "agents" with tools, run sequentially + in parallel) |
| Vernacular | **Bhashini APIs** (ASR/TTS/translation) with **Gemini multilingual as fallback** |
| PDF/Docs | **pdf-lib** or **@react-pdf/renderer** for generated documents |
| Deploy | **Vercel** (frontend + API routes) OR Firebase Hosting + Cloud Functions |

### ALTERNATIVE (only if you want maximal "agentic framework" credibility)
Use **Google ADK** (Python) on **Cloud Run** for the agent layer, with the Next.js app calling it over HTTP. More authentic multi-agent story, but a polyglot setup and harder for one-shot generation. **Recommendation: ship the TypeScript path first; mention ADK in your pitch as the production roadmap.** If your team is strong in Python and has time, swap `lib/agents/` for an ADK service with `SequentialAgent` (pipeline) + `ParallelAgent` (concurrent claim tracks) + `LoopAgent` (refine-until-complete).

---

## 3. PREREQUISITES (you do these once, before/while building)

1. **Firebase project** → enable Auth (Email + Phone), Firestore, Storage. Get the web config + a service-account JSON (for admin SDK).
2. **Gemini API key** → Google AI Studio (free tier). Put in `.env.local` as `GEMINI_API_KEY`.
3. **Bhashini** → register at bhashini.gov.in for API credentials (`udyat`/user-id + ULCA key). Optional for Phase 1; needed in Phase 2.
4. **Node 20+**, npm/pnpm.
5. `.env.local` (server-only secrets):
```
GEMINI_API_KEY=...
FIREBASE_SERVICE_ACCOUNT={...json...}
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
BHASHINI_USER_ID=...   # phase 2
BHASHINI_API_KEY=...   # phase 2
DEMO_MODE=true
```

---

## 4. PHASE OVERVIEW

| Phase | Delivers | Why |
|---|---|---|
| **0 — Foundation** | Scaffold, Firebase wired, auth, layout, design system, Firestore schema, demo-mode flag | Solid base |
| **1 — Core MVP (the winning slice)** | Intake wizard → upload death certificate → Gemini OCR → personalized roadmap → generate ONE filled document + bank-claim checklist | Demos the whole value end-to-end |
| **2 — Multi-agent + vernacular** | Parallel claim tracks (bank/EPFO/insurance) + "trace unclaimed money" agent + Bhashini voice (Hindi) | Depth + reach |
| **3 — Document vault + reminders** | Reusable document vault, deadline tracking, per-state court-fee logic, more document templates | Completeness |
| **4 — Hardening + polish** | DPDP encryption/consent/audit, security rules, animations, deploy, recorded demo | Production feel |

---

## 5. FOLDER STRUCTURE (target)

```
antim-sahara/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                      # landing / hero
│  ├─ (auth)/login/page.tsx
│  ├─ (app)/
│  │  ├─ dashboard/page.tsx         # list of cases
│  │  ├─ onboarding/page.tsx        # intake wizard
│  │  └─ case/[caseId]/
│  │     ├─ page.tsx                # the roadmap (main screen)
│  │     ├─ documents/page.tsx      # document vault
│  │     ├─ task/[taskId]/page.tsx  # task detail + generated docs
│  │     └─ claim/[claimId]/page.tsx
│  └─ api/
│     ├─ agents/
│     │  ├─ orchestrate/route.ts    # planner → roadmap
│     │  ├─ parse-document/route.ts # DocumentParser agent
│     │  ├─ advise/route.ts         # SuccessionAdvisor agent
│     │  └─ generate-doc/route.ts   # DocumentGenerator agent
│     ├─ bhashini/route.ts          # phase 2
│     └─ unclaimed/route.ts         # phase 2
├─ components/
│  ├─ ui/                           # shadcn components
│  ├─ intake/IntakeWizard.tsx
│  ├─ roadmap/RoadmapTimeline.tsx, TaskCard.tsx, AgentActivity.tsx
│  ├─ documents/DocUpload.tsx, DocViewer.tsx, GeneratedDoc.tsx
│  └─ shared/Disclaimer.tsx, LanguageToggle.tsx, VoiceButton.tsx
├─ lib/
│  ├─ firebase/client.ts, admin.ts
│  ├─ gemini/client.ts, schemas.ts          # zod/JSON schemas for structured output
│  ├─ agents/
│  │  ├─ orchestrator.ts                     # plans the roadmap
│  │  ├─ documentParser.ts                   # OCR → structured
│  │  ├─ successionAdvisor.ts                # branch by religion/nominee
│  │  ├─ documentGenerator.ts                # fill templates
│  │  └─ types.ts
│  ├─ succession/rules.ts                    # legal branching logic (Hindu/Muslim/Christian/Parsi; nominee/threshold)
│  ├─ templates/                             # document templates (affidavit, indemnity bond, bank cover letter…)
│  ├─ demo/seed.ts, cachedResponses.ts       # demo-mode data
│  └─ utils.ts
├─ types/index.ts
├─ firestore.rules
├─ .env.local
└─ README.md
```

---

## 6. FIRESTORE DATA MODEL

```
users/{uid}
  - displayName, phone, email, preferredLanguage, createdAt

cases/{caseId}
  - ownerUid
  - deceased: { name, dob, dod, religion (hindu|muslim|christian|parsi|other),
                domicileState, hadWill (bool), photoUrl? }
  - relationshipToDeceased (spouse|son|daughter|parent|sibling|other)
  - status (active|completed)
  - createdAt, updatedAt
  - summary: { totalTasks, doneTasks, blockedTasks }   # denormalized for UI

cases/{caseId}/heirs/{heirId}
  - name, relationship, share?, isClaimant (bool), hasNOC (bool)

cases/{caseId}/assets/{assetId}
  - type (bank_account|epf|insurance|mutual_fund|demat|property|pension|other)
  - institution, identifier (acct no/policy no - store masked), approxValue?,
    hasNominee (bool), nomineeName?, jointHolder?

cases/{caseId}/tasks/{taskId}
  - title, description
  - category (registration|bank|epfo|insurance|mutualfund|succession|unclaimed|pension)
  - status (todo|in_progress|blocked|done)
  - dependencies: [taskId]            # blocked until these are done
  - requiredDocs: [docType]
  - deadline? (e.g., 21-day registration)
  - institution?
  - generatedDocIds: [docId]
  - guidance (string, plain-language steps)

cases/{caseId}/documents/{docId}
  - docType (death_certificate|aadhaar|pan|legal_heir_cert|passbook|policy_bond|
             affidavit|indemnity_bond|noc|succession_cert|generated_letter)
  - storagePath, fileName, mimeType
  - extracted: { ...structured fields from Gemini... }   # for death cert etc.
  - isGenerated (bool)
  - createdAt
```

**`firestore.rules` (sketch):**
```
match /users/{uid} { allow read, write: if request.auth.uid == uid; }
match /cases/{caseId} {
  allow read, write: if request.auth != null && resource.data.ownerUid == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
  match /{sub=**} {
    allow read, write: if request.auth != null
      && get(/databases/$(database)/documents/cases/$(caseId)).data.ownerUid == request.auth.uid;
  }
}
```

---

## 7. PHASE 0 PROMPT — paste into Claude Code

```
Build the foundation for a Next.js 15 web app called "Antim Sahara" — a compassionate
AI death & estate concierge for India. Use App Router + TypeScript + Tailwind + shadcn/ui
+ Motion (framer-motion) + Firebase (Auth, Firestore, Storage).

Set up:
1. Next.js 15 App Router project in TypeScript. Install: firebase, firebase-admin,
   @google/genai, framer-motion, zod, pdf-lib, lucide-react, and shadcn/ui (init with a
   warm, calming theme — soft neutrals, deep indigo/teal accent, generous whitespace,
   rounded-2xl, large readable type). Dark mode optional.
2. Firebase: lib/firebase/client.ts (web SDK from NEXT_PUBLIC_* env) and lib/firebase/
   admin.ts (admin SDK from FIREBASE_SERVICE_ACCOUNT). Email + Phone(OTP) auth.
3. Auth flow: (auth)/login page (email + phone OTP), an AuthProvider context, route
   protection so (app)/* requires login, redirect to /login otherwise.
4. Global layout with: a calm top bar (logo "Antim Sahara", language toggle placeholder,
   account menu), and a persistent footer Disclaimer component with the text:
   "Antim Sahara provides general guidance, not legal advice. Rules, fees, and thresholds
   vary by state and institution — please verify with the relevant office."
   Show a one-time consent modal on first login.
5. A warm landing page (app/page.tsx): empathetic hero ("Losing someone is hard. The
   paperwork shouldn't be." ), 3-step explainer, gentle CTA "Begin" → onboarding.
6. Create the full TypeScript types in types/index.ts and the Firestore data model exactly
   as specified below [PASTE SECTION 6 HERE], plus firestore.rules.
7. Create the folder structure exactly as specified below [PASTE SECTION 5 HERE] with
   empty/stub files where a later phase will fill them.
8. Add a DEMO_MODE env flag (lib/demo/) — when true, AI calls should be routed to cached
   responses (stub the helper now; we'll fill cached data later).
9. README.md with setup steps and the .env.local template.

Tone of all UI copy: warm, calm, reassuring, simple language. Accessibility: large tap
targets, high contrast, aria labels. Do NOT put any API key in client code.
Make it run with `npm run dev` with no errors. Use placeholder env values where needed.
```

---

## 8. PHASE 1 PROMPT — THE CORE WINNING SLICE — paste into Claude Code

This is the slice that demonstrates the entire idea: **intake → upload death certificate → Gemini reads it → personalized roadmap is generated → one filled document + a checklist.** Build demo-mode in from the start.

### 8a. The agents (define these in `lib/agents/`)

**1) DocumentParser agent** (`parse-document/route.ts`)
- Input: an uploaded image/PDF of a death certificate (and later, passbook/policy).
- Calls Gemini 2.5 Flash (multimodal) with **structured JSON output** (schema in `lib/gemini/schemas.ts`).
- Output schema for a death certificate: `{ deceasedName, dateOfDeath, dateOfBirth?, place, registrationNo?, fatherOrSpouseName?, confidence }`.
- Saves `extracted` onto the document + pre-fills the case.

**2) SuccessionAdvisor agent** (`advise/route.ts`)
- Input: case facts (religion, hadWill, relationship, assets[] with hasNominee, approxValue, domicileState).
- Uses `lib/succession/rules.ts` (deterministic legal branching) + Gemini to explain in plain language.
- Output: for each asset/situation, **which instrument is needed** (nominee route / Legal Heir Certificate / Succession Certificate / Probate / Letters of Administration) and **why**, plus class of heirs by religion.

**3) Orchestrator/Planner agent** (`orchestrate/route.ts`)
- Input: full case + advisor output.
- Produces the **roadmap**: an ordered, dependency-aware list of tasks (category, title, plain-language guidance, requiredDocs, deadline, institution) written to `cases/{id}/tasks`.
- Marks tasks `blocked` when dependencies aren't done (e.g., everything depends on `death_certificate`).

**4) DocumentGenerator agent** (`generate-doc/route.ts`)
- Input: a task + case + heir data.
- Fills a **template** from `lib/templates/` (Phase 1: bank claim cover letter + indemnity bond) using Gemini for variable text, renders to PDF via pdf-lib, saves to Storage + a `documents` record.

### 8b. The legal branching logic to hard-code in `lib/succession/rules.ts`

```
Encode these rules (guidance, show disclaimers; let figures be CONFIG constants so they're
easy to update, and label each as "verify"):

BANK ACCOUNT:
- If hasNominee OR joint "either or survivor": → NOMINEE ROUTE. Needs: claim form +
  death certificate + claimant ID. No succession certificate, any amount.
- Else if value <= BANK_THRESHOLD (config: ₹15,00,000 commercial / ₹5,00,000 cooperative):
  → SIMPLIFIED ROUTE. Needs: claim form, death cert, ID, indemnity bond, NOC/disclaimer
  from other heirs, legal heir certificate/affidavit.
- Else: → SUCCESSION CERTIFICATE (or Probate if valid will). 

WILL:
- hadWill = true → path is PROBATE (mandatory in Mumbai/Chennai/Kolkata jurisdictions;
  banks may act on undisputed will otherwise) or Letters of Administration if no executor.
- hadWill = false → intestate succession by religion (below) + Succession Certificate for
  financial assets / Legal Heir Certificate for pension/PF.

INTESTATE HEIRS BY RELIGION (for explanation):
- Hindu/Buddhist/Jain/Sikh: Hindu Succession Act 1956 — Class I heirs equally
  (son, daughter, widow, mother...). Daughters = coparceners (2005 amendment).
- Muslim: personal law (Sunni/Shia sharers + residuaries); testamentary cap 1/3.
- Christian: Indian Succession Act 1925 s.33 (spouse 1/3 + descendants 2/3, etc.).
- Parsi: ISA ss.50–53 (spouse + children equal; parents half-share).

EPFO (if deceased was employed): EPF Form 20 + EPS Form 10D + EDLI Form 5IF via last
employer. (No succession certificate for these — uses nomination/legal heir.)
INSURANCE: claim form + policy bond + death cert + claimant ID (IRDAI ~30-day norm).
MUTUAL FUND/DEMAT: transmission via RTA/DP; simplified if value <= SEBI thresholds
(config: ₹5,00,000 physical per issuer / ₹15,00,000 demat per account), else succession cert.
ALWAYS surface: death registration within 21 days as the first task.
```

### 8c. The screens (Phase 1)

- **Onboarding intake wizard** (`onboarding/page.tsx`): gentle multi-step — (1) who passed away (name, dates), (2) your relationship, (3) their religion + home state + was there a will?, (4) what assets do you know of (add bank/EPF/insurance/MF rows with nominee yes/no + approx value), (5) upload death certificate (if available). On finish → create `case`, run DocumentParser (if cert uploaded) → SuccessionAdvisor → Orchestrator → go to roadmap.
- **Roadmap** (`case/[caseId]/page.tsx`): the hero screen. A calm vertical **timeline** of tasks grouped by category, each `TaskCard` with status, plain-language guidance, required documents, deadline chip. An **AgentActivity** panel (subtle) that shows the agents that produced the plan ("Reviewing documents… Determining required certificates… Building your roadmap"). A progress ring ("3 of 11 done"). Show "What needs attention now" vs "What can wait."
- **Task detail** (`case/[caseId]/task/[taskId]/page.tsx`): full guidance, the checklist of required docs (link to vault), and a **"Generate document"** button → calls DocumentGenerator → shows the filled PDF inline with download.
- **Document vault** (`case/[caseId]/documents/page.tsx`): upload + list documents; show extracted fields for the death certificate.

### 8d. Phase 1 prompt text

```
Implement Phase 1 of Antim Sahara: the core working flow from intake to a generated
document. Build on the existing Phase 0 scaffold.

1. Gemini client (lib/gemini/client.ts) using @google/genai with GEMINI_API_KEY
   (server-side only). Add zod schemas in lib/gemini/schemas.ts for structured output.

2. Implement these four agents as Next.js route handlers + lib/agents modules
   [PASTE SECTION 8a]. Each agent: validate input, call Gemini with structured JSON output,
   write results to Firestore, return typed JSON. When DEMO_MODE=true, return cached
   responses from lib/demo/cachedResponses.ts instead of calling Gemini.

3. Implement lib/succession/rules.ts with the deterministic legal branching
   [PASTE SECTION 8b]. Keep all monetary thresholds as named CONFIG constants with a
   "// VERIFY: varies by state/institution" comment. The SuccessionAdvisor agent should
   combine these rules with a Gemini call that explains the result in warm, plain language.

4. Build the intake wizard, roadmap screen, task-detail screen, and document vault
   [PASTE SECTION 8c]. Use shadcn/ui + Motion for gentle transitions. The roadmap is the
   centerpiece — make it beautiful, calm, and clear, with an AgentActivity panel showing
   the multi-agent process, a progress ring, and "needs attention now / can wait" sections.

5. Document templates in lib/templates/: a bank-account claim cover letter and an indemnity
   bond (Indian format, placeholders for names/dates/account/amount/heirs). DocumentGenerator
   fills them via Gemini + renders PDF with pdf-lib, saves to Firebase Storage, records a
   documents entry, and links it to the task.

6. Seed data (lib/demo/seed.ts) + cached AI responses (lib/demo/cachedResponses.ts) for a
   fictional deceased persona "Late Shri Ramesh Kumar Sharma" (Hindu, Madhya Pradesh, no will,
   one SBI account WITHOUT nominee ~₹6,00,000, one LIC policy, EPF from a private employer,
   one mutual fund). With DEMO_MODE=true the whole flow runs instantly from cache so the live
   demo never hits an API limit. Add a small "Demo case" button on the dashboard to load it.

Every legal step must show the guidance-not-legal-advice disclaimer. Keep all keys server-side.
Make the full flow work end-to-end: load demo case → see roadmap → open the bank task →
generate the claim letter PDF → download it.
```

---

## 9. DEMO-MODE (build it in Phase 1, don't bolt on later)

- `DEMO_MODE=true` → every agent route returns a hand-checked cached JSON (so no live Gemini call). Pre-generate the roadmap + one filled PDF for the seed persona and store as fixtures.
- Add a **"Load demo case"** button on the dashboard.
- Keep a **recorded screen capture** of the full flow as your ultimate fallback.
- Rehearse: load demo case → roadmap appears → open SBI bank task → "Generate document" → claim letter PDF downloads. ~60–90 seconds, flawless.

---

## 10. PHASES 2–4 (outline — I'll write each in full on request)

**Phase 2 — Multi-agent depth + vernacular (the "agentic" wow)**
- Run **parallel claim tracks** (bank + EPFO + insurance + mutual fund) concurrently — surface this in the AgentActivity panel as multiple agents working at once (this is your "Agentic Premier League" story).
- **Trace-unclaimed-money agent**: explains and links UDGAM (bank deposits), Bima Bharosa (insurance), IEPF-5 (shares/dividends) and builds a search + claim packet.
- **Bhashini integration** (`api/bhashini/route.ts`): voice input + spoken guidance in Hindi (convert WebM→WAV; Gemini multilingual fallback). LanguageToggle goes live. VoiceButton reads the current task aloud.

**Phase 3 — Vault, reminders, more documents**
- Reusable **document vault**: a doc uploaded once (death certificate) auto-attaches to every claim that needs it.
- **Deadline tracking + reminders** (21-day registration, claim windows) via Firestore + optional FCM.
- **Per-state court-fee estimator** (config table; label "verify").
- More templates: succession-certificate petition draft, affidavit, NOC, EPFO composite death claim helper.

**Phase 4 — Hardening + polish + deploy**
- DPDP-style: consent screen, privacy notice, encryption notes, audit log of access, data-erasure option, tighten `firestore.rules`.
- Visual polish: micro-animations, empty states, loading skeletons, a "memory" header (deceased's name/photo) that keeps the tone human.
- **Deploy** to Vercel (or Firebase Hosting + Functions); add the live URL to the README and your pitch deck.
- Final demo rehearsal + recorded backup.

---

## 11. PITCH FRAMING (so judges read it as a SOCIAL CAUSE, not fintech)

- Lead with the human story: *"When my grandfather died, my mother spent months running between offices while grieving."*
- The stat: **₹74,000+ crore in unclaimed bank deposits** sit stranded — much of it because grieving families can't navigate the bureaucracy; **<10% of Indians have a will.**
- The cause: **bereavement support + dignity + financial inclusion** for ordinary families at their most vulnerable moment.
- The tech: a **multi-agent Gemini system** that turns months of trauma into one guided, compassionate, multilingual path.
- Hits all five criteria: Innovation (white space — no Indian post-death concierge), Real-World Impact (every family, huge stranded money), Completion (working end-to-end demo), UI/UX (calm broadcast-quality), Deployment (live URL on Google stack).

---

## 12. REMEMBER TO VERIFY (don't quote on stage without re-checking)
Thresholds and fees change and vary by state/institution: RBI ₹15L/₹5L no-nominee thresholds, SEBI ₹5L/₹15L transmission thresholds, EDLI ₹2.5L–₹7L, state court-fee caps, IEPF timelines, and current Gemini model names/free-tier limits. Keep them as editable CONFIG constants in code.
