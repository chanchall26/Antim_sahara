import type { TaskCategory } from "@/types";
import type { TemplateDef } from "./types";
import { bankClaimLetter } from "./bankClaim";
import { indemnityBond } from "./indemnityBond";
import {
  heirshipAffidavit,
  heirNoc,
  successionPetition,
  insuranceClaimLetter,
} from "./more";

export const TEMPLATES: TemplateDef[] = [
  bankClaimLetter,
  indemnityBond,
  heirshipAffidavit,
  heirNoc,
  successionPetition,
  insuranceClaimLetter,
];

export function getTemplate(key: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

/** Which document templates make sense for a given task category. */
export function templatesForCategory(category: TaskCategory): TemplateDef[] {
  switch (category) {
    case "bank":
      return [bankClaimLetter, indemnityBond, heirNoc, heirshipAffidavit];
    case "insurance":
      return [insuranceClaimLetter];
    case "succession":
      return [successionPetition, heirshipAffidavit, heirNoc];
    case "mutualfund":
      return [indemnityBond, heirNoc, heirshipAffidavit];
    case "epfo":
    case "pension":
      return [heirshipAffidavit];
    default:
      return [];
  }
}

export * from "./types";
