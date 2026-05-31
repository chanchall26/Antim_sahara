import { formatINR } from "@/lib/utils";
import type { TemplateDef, RenderedTemplate, TemplateVars } from "./types";

export const bankClaimLetter: TemplateDef = {
  key: "bank_claim_letter",
  label: "Bank account claim cover letter",
  docType: "generated_letter",
  render: (v: TemplateVars): RenderedTemplate => {
    const today = v.date ?? new Date().toISOString().slice(0, 10);
    return {
      title: "Bank Account Claim — Cover Letter",
      docType: "generated_letter",
      to: [
        "To,",
        "The Branch Manager",
        v.institution,
        v.domicileState ? `${v.domicileState}, India` : "India",
      ],
      subject: `Settlement of the account of the late ${v.deceasedName}${
        v.accountOrPolicyNo ? ` (A/c ${v.accountOrPolicyNo})` : ""
      }`,
      body: [
        `Date: ${today}`,
        "",
        "Respected Sir/Madam,",
        "",
        `I, ${v.claimantName}, am the ${v.claimantRelationship} of the late ${v.deceasedName}, who passed away on ${
          v.dateOfDeath ?? "________"
        }. I write to request settlement of the deceased's account held with your branch${
          v.accountOrPolicyNo ? ` bearing account number ${v.accountOrPolicyNo}` : ""
        }.`,
        "",
        v.approxValue
          ? `The approximate balance in the account is ${formatINR(
              v.approxValue,
            )}. As this is within the simplified-settlement threshold under the RBI (Settlement of Claims in respect of Deceased Customers of Banks) Directions, 2025, I request settlement under the simplified procedure.`
          : "I request settlement in accordance with the RBI (Settlement of Claims in respect of Deceased Customers of Banks) Directions, 2025.",
        "",
        "I enclose the following documents for your kind verification:",
        "  1. Certified copy of the death certificate",
        "  2. My identity and address proof (Aadhaar/PAN)",
        "  3. Duly completed bank claim form (Annexure I-B)",
        "  4. Indemnity bond (Annexure I-C), where applicable",
        "  5. Legal Heir Certificate / affidavit and NOC from other heirs (Annexures I-D/I-E)",
        ...(v.heirs && v.heirs.length
          ? ["", `The legal heirs of the deceased are: ${v.heirs.join(", ")}.`]
          : []),
        "",
        "I request you to kindly settle the claim at the earliest, within the 15-day service standard. I shall be glad to provide any further information required.",
        "",
        "Thanking you,",
      ],
      signature: [
        "Yours faithfully,",
        "",
        v.claimantName,
        `(${v.claimantRelationship} of the deceased)`,
        ...(v.claimantAddress ? [v.claimantAddress] : []),
      ],
    };
  },
};
