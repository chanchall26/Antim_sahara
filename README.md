# 🪔 Antim Sahara — _अंतिम सहारा_

**A compassionate, AI-guided "death & estate concierge" for Indian families.**

When someone we love dies, grief and bureaucracy arrive together. Antim Sahara gently
walks a grieving family, one step at a time, through everything that must be done after a
loss — **death registration → bank / EPFO / insurance / mutual-fund claims → succession
papers → tracing unclaimed money** — branching by religion, asset type, will status and
nominee status, in **five Indian languages**.

> _Built for a social-cause hackathon. Guidance, not legal advice._

---

## ✨ What it does

| | Feature |
|---|---|
| 🧭 | **Personal roadmap** — an ordered, dependency-aware plan ("what needs attention now" vs "what can wait") generated from your situation |
| 🤖 | **Multi-agent system** — DocumentParser → SuccessionAdvisor → Orchestrator → DocumentGenerator, with parallel claim tracks (the "agentic" story) |
| 📄 | **Document parsing** — upload a death certificate, Gemini reads it and fills your case |
| ⚖️ | **Correct legal routing** — nominee route vs Legal Heir Certificate vs Succession Certificate vs Probate, branching by Hindu / Muslim / Christian / Parsi law |
| 🖋️ | **Generated paperwork** — filled bank claim letters, indemnity bonds, affidavits, NOCs, succession petitions → downloadable PDFs |
| 🗄️ | **Document vault** — upload once, auto-reused across every claim that needs it |
| 💰 | **Trace unclaimed money** — UDGAM (banks), Bima Bharosa (insurance), IEPF (shares) with tailored search packets |
| 🧮 | **Court-fee estimator** — per-state succession/probate fee guidance |
| 🌐 | **Bilingual+** — full UI in **English, हिन्दी, বাংলা, मराठी, తెలుగు** + 8 more in the dropdown, with **read-aloud voice** |
| 🔒 | **DPDP-aware** — consent gate, encryption, access audit log, one-tap data erasure |
| 🎭 | **Demo mode** — the whole flow runs instantly on seeded data + cached AI, so a live demo **never** fails on an API limit |

---

## 🚀 Quick start (runs with ZERO setup)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** → click **"Explore in demo mode"** → **"Load the demo case"**.
The entire flow works offline — no keys, no backend. Your data stays in the browser.

> **Demo mode is the default** (`NEXT_PUBLIC_DEMO_MODE=true`). Add keys below only when you
> want live Gemini AI or cloud sync.

---

## 🎬 60-second demo script (rehearse this)

1. **Login** → "Explore in demo mode" → accept the consent.
2. **Dashboard** → "Load the demo case" (Late Shri Ramesh Kumar Sharma).
3. **Roadmap** appears — note the progress ring, the agent-activity panel, "needs now / can wait", the 21-day registration deadline.
4. Open **"Claim the bank account — State Bank of India"**.
5. Click a document button → a **filled PDF claim letter** appears inline → **Download**.
6. Toggle the **language** to हिन्दी — the whole UI re-renders. Tap **🔊 read aloud**.
7. Open **"Trace unclaimed money"** → show UDGAM / Bima Bharosa / IEPF packets.

---

## 🔑 Adding your keys (optional — you asked how!)

Copy the template, then fill what you want:

```bash
cp .env.local.example .env.local
```

### 1. Gemini (live AI — free)
1. Go to **https://aistudio.google.com/apikey** → **Create API key**.
2. Paste it into `.env.local` as `GEMINI_API_KEY=...`.
3. Set `NEXT_PUBLIC_DEMO_MODE=false` to use live AI (keep `true` for a safe demo).

> The key is **server-side only** — it never reaches the browser. Default model is
> `gemini-2.5-flash`; override with `GEMINI_MODEL`.

### 2. Firebase (optional — cloud auth + sync)
The Firebase **CLI is already installed** (`firebase --version`). To get the keys:

```bash
firebase login                       # opens the browser
firebase projects:create antim-sahara   # or use an existing project
firebase apps:create WEB "Antim Sahara" # creates a web app
firebase apps:sdkconfig WEB             # prints the NEXT_PUBLIC_FIREBASE_* values
```

Copy those values into `.env.local`. Then, in the
[Firebase console](https://console.firebase.google.com/):
- **Build → Authentication → Sign-in method** → enable **Email/Password** and **Phone**.
- **Build → Firestore Database** → Create database → paste the rules from
  [`firestore.rules`](firestore.rules) (or run `firebase deploy --only firestore:rules`).
- **Build → Storage** → Get started (for document uploads).

For the **server-side admin key** (`FIREBASE_SERVICE_ACCOUNT`):
- Console → ⚙️ **Project settings → Service accounts → Generate new private key**.
- Open the downloaded JSON, copy the **whole thing onto one line**, and paste it as the
  value of `FIREBASE_SERVICE_ACCOUNT` in `.env.local`.

> Without Firebase, the app uses local-device storage + instant demo auth — perfect for a
> hackathon demo. Add Firebase only if you want accounts + cloud sync.

### 3. Bhashini (optional — authentic Indic voice)
Register at **https://bhashini.gov.in** (ULCA) for `BHASHINI_USER_ID` + `BHASHINI_API_KEY`.
Until set, voice falls back to the browser's speech engine + Gemini translation, so it
already works.

---

## 🧱 Tech stack

- **Next.js 16 (App Router) + TypeScript** · **React 19**
- **Tailwind CSS v4** + hand-built shadcn-style UI primitives
- **Motion** (framer-motion) — gentle, calm animation
- **@google/genai** — Gemini 2.5 Flash (multimodal OCR + structured JSON)
- **Firebase** (Auth / Firestore / Storage) — optional, graceful fallback
- **pdf-lib** — generated document PDFs
- **Custom i18n** — deep-merge dictionaries with English fallback (modular & dynamic)

---

## 🗂️ Architecture

```
app/
  page.tsx                       landing (empathetic hero)
  (auth)/login                   email / phone / demo sign-in
  (app)/                         auth-guarded shell (TopBar + Disclaimer footer)
    dashboard                    your cases + "load demo case"
    onboarding                   gentle 5-step intake wizard
    case/[caseId]/               roadmap (centerpiece)
      task/[taskId]              task detail + generate document
      documents                  document vault
      unclaimed                  trace unclaimed money
    account/privacy              DPDP: audit log + erase data
  api/
    agents/orchestrate           Planner — builds the roadmap
    agents/parse-document        DocumentParser — Gemini OCR (or demo cache)
    agents/advise                SuccessionAdvisor — legal routing
    agents/generate-doc          DocumentGenerator — fills templates → PDF
    bhashini                     voice/translation (Bhashini → Gemini fallback)
    unclaimed                    unclaimed-money search packet
lib/
  succession/rules.ts            ⚖️ deterministic legal branching engine
  succession/courtFees.ts        per-state court-fee estimator
  agents/orchestrator.ts         roadmap builder (works with no keys)
  templates/                     document templates + pdf-lib renderer
  i18n/                          dictionaries (en/hi/bn/mr/te) + provider
  store/                         client case store (localStorage) + audit
  demo/                          seed persona + cached AI responses
  config.ts                      ⚠️ all thresholds as CONFIG constants ("// VERIFY")
firestore.rules                  owner-scoped security rules
```

### Why it runs with no backend
Every agent has a **deterministic core** (the succession rules are hard-coded law, not AI),
so the roadmap is real and correct even with zero keys. Gemini only **enriches** prose and
reads documents; Firebase only adds cloud sync. This is what makes the demo bullet-proof.

---

## 🧪 Verify it works

```bash
npm run build            # full production build (all 16 routes)
npx tsc --noEmit         # typecheck
node scripts/smoke.mjs   # headless end-to-end demo flow (needs `npm run dev` running)
```

---

## ⚠️ Important

- **This is guidance, not legal or financial advice.** Every threshold, fee and timeline
  **varies by state and institution and must be re-verified** against the primary source.
  They live as editable `CONFIG` constants in [`lib/config.ts`](lib/config.ts).
- Sources: RBI Settlement of Claims Directions 2025 · SEBI transmission thresholds (2022) ·
  EPFO EDLI (CBT 2024) · Indian Succession Act 1925 · Hindu Succession Act 1956. See the
  research dossier in [`docs/`](docs/).
- Sensitive death/financial data → DPDP Act 2023: encrypted, owner-scoped, erasable.

---

_🪔 In memory of every family that has had to choose between mourning and paperwork._
