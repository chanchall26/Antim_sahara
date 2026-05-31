import type { DocType } from "@/types";

export interface TemplateVars {
  deceasedName: string;
  dateOfDeath?: string;
  domicileState?: string;
  institution: string;
  accountOrPolicyNo?: string;
  approxValue?: number;
  claimantName: string;
  claimantRelationship: string;
  claimantAddress?: string;
  heirs?: string[];
  date?: string;
}

export interface RenderedTemplate {
  /** Used as the PDF title + filename. */
  title: string;
  docType: DocType;
  /** Optional recipient block (right under the title). */
  to?: string[];
  subject?: string;
  /** Ordered paragraphs / lines. Empty string = blank line. */
  body: string[];
  /** Signature block lines. */
  signature?: string[];
}

export interface TemplateDef {
  key: string;
  label: string;
  docType: DocType;
  render: (vars: TemplateVars) => RenderedTemplate;
}
