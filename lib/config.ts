/**
 * Central configuration.
 *
 * IMPORTANT — every monetary threshold / fee / timeline below is GUIDANCE only and
 * "// VERIFY: varies by state/institution". Keep them here so they are trivial to update.
 * Sources: RBI Settlement of Claims Directions 2025, SEBI transmission thresholds (2022),
 * EPFO EDLI (CBT Apr 2024), Indian Succession Act 1925. See /docs research dossier.
 */

/** Demo-mode flag. When true, the app runs fully on seeded data + cached AI (no live keys). */
export const DEMO_MODE: boolean =
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE ?? "true").toLowerCase() !==
  "false";

/** True if a Gemini key is configured server-side. */
export const HAS_GEMINI = Boolean(process.env.GEMINI_API_KEY);

/** True if Firebase web config is present (client-side detectable). */
export const HAS_FIREBASE = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);

export const CONFIG = {
  // 21-day free death registration window (RBDA 1969, amended 2023).
  DEATH_REGISTRATION_DAYS: 21, // VERIFY: late fees / DM order beyond this vary by state

  // RBI 2025 — no-nominee simplified settlement thresholds.
  BANK_THRESHOLD_COMMERCIAL: 1_500_000, // ₹15,00,000  // VERIFY: bank may fix higher
  BANK_THRESHOLD_COOPERATIVE: 500_000, // ₹5,00,000   // VERIFY

  // SEBI simplified transmission thresholds (Apr 2022).
  SEBI_THRESHOLD_PHYSICAL: 500_000, // ₹5,00,000 per listed issuer (physical)  // VERIFY
  SEBI_THRESHOLD_DEMAT: 1_500_000, // ₹15,00,000 per beneficiary account (demat) // VERIFY

  // EPFO EDLI insurance (CBT Apr 2024).
  EDLI_MIN: 250_000, // ₹2,50,000  // VERIFY
  EDLI_MAX: 700_000, // ₹7,00,000  // VERIFY

  // Bank settlement service standard (RBI 2025).
  BANK_SETTLEMENT_DAYS: 15, // VERIFY
  INSURANCE_SETTLEMENT_DAYS: 30, // IRDAI norm // VERIFY

  // Tracing unclaimed money (public stats — re-verify before quoting).
  DEA_FUND_CRORE: 74_000, // ₹74,000+ crore unclaimed bank deposits (approx)  // VERIFY
} as const;

/** Persistent disclaimer shown on every legal/guidance screen. */
export const DISCLAIMER_KEY = "disclaimer.persistent";

export const APP_NAME = "Antim Sahara";
export const REPO_FORMAT = "APL_GWALIOR_<TeamName>";
