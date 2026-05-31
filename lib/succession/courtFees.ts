/**
 * Per-state succession/probate court-fee estimator (GUIDANCE — "// VERIFY" each value
 * against the state's amended Court-Fees Act PDF on indiacode.nic.in before quoting).
 * Source: research dossier Part A3.
 */
export interface CourtFeeRule {
  state: string;
  /** ad-valorem percentage applied to the value of debts/securities. */
  percent: number;
  /** maximum fee cap in ₹ (null = no cap / base Act). */
  cap: number | null;
  note?: string;
}

export const COURT_FEE_RULES: CourtFeeRule[] = [
  { state: "Maharashtra", percent: 7.5, cap: 75000, note: "Widows: probate/LoA max reduced to ₹10,000 (2024)." },
  { state: "West Bengal", percent: 3, cap: 50000, note: "Capped at ₹50,000 regardless of value." },
  { state: "Karnataka", percent: 5, cap: 30000, note: "Linked to the probate scale (~₹30,000 cap)." },
  { state: "Tamil Nadu", percent: 3, cap: 25000, note: "2% up to ₹5,000; challenge to fees beyond ₹25,000 litigated." },
  { state: "Gujarat", percent: 7.5, cap: 75000 },
  { state: "Kerala", percent: 2.5, cap: null, note: "Ad valorem under the 1959 Act (~2–3%)." },
  { state: "Delhi", percent: 2.5, cap: null, note: "Base Court Fees Act 1870 rates — unsettled, re-verify." },
];

const DEFAULT_RULE: CourtFeeRule = {
  state: "Other",
  percent: 3,
  cap: null,
  note: "Base ad-valorem estimate — verify your state's amended Court-Fees Act.",
};

export function ruleForState(state: string): CourtFeeRule {
  return COURT_FEE_RULES.find((r) => r.state.toLowerCase() === state.toLowerCase()) ?? DEFAULT_RULE;
}

export function estimateCourtFee(value: number, state: string): { fee: number; rule: CourtFeeRule } {
  const rule = ruleForState(state);
  const raw = (value * rule.percent) / 100;
  const fee = rule.cap != null ? Math.min(raw, rule.cap) : raw;
  return { fee: Math.round(fee), rule };
}
