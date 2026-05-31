import type { DocType } from "@/types";

/** Human-readable labels for document types (standard Indian document names). */
export const DOC_LABELS: Record<DocType, string> = {
  death_certificate: "Death certificate",
  aadhaar: "Aadhaar (claimant ID)",
  pan: "PAN card",
  legal_heir_cert: "Legal Heir Certificate",
  passbook: "Bank passbook / cancelled cheque",
  policy_bond: "Insurance policy bond",
  affidavit: "Affidavit",
  indemnity_bond: "Indemnity bond",
  noc: "NOC from co-heirs",
  succession_cert: "Succession Certificate",
  generated_letter: "Claim cover letter",
};
