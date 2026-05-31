/**
 * Hand-checked cached AI outputs for DEMO_MODE so the live demo never hits a rate limit.
 * Keyed loosely; the parse-document route returns the death-cert cache when in demo mode.
 */
import type { DeathCertParsed } from "@/lib/gemini/schemas";

export const CACHED_DEATH_CERT: DeathCertParsed = {
  deceasedName: "Ramesh Kumar Sharma",
  dateOfDeath: "2026-05-20",
  dateOfBirth: "1955-07-14",
  place: "Gwalior, Madhya Pradesh",
  registrationNo: "MP/GWL/2026/004821",
  fatherOrSpouseName: "Sushila Devi Sharma",
  confidence: 0.94,
};

/** A warm, plain-language enrichment used when Gemini is unavailable. */
export function cachedWarmExplanation(instrument: string, base: string): string {
  return base;
}
