import { formatINR } from "@/lib/utils";
import type { TemplateDef, RenderedTemplate, TemplateVars } from "./types";

export const indemnityBond: TemplateDef = {
  key: "indemnity_bond",
  label: "Indemnity bond (heir declaration)",
  docType: "indemnity_bond",
  render: (v: TemplateVars): RenderedTemplate => {
    const today = v.date ?? new Date().toISOString().slice(0, 10);
    return {
      title: "Indemnity Bond",
      docType: "indemnity_bond",
      subject: "(To be executed on non-judicial stamp paper of the value prescribed by the State)",
      body: [
        `THIS DEED OF INDEMNITY is made on ${today} by ${v.claimantName}, ${v.claimantRelationship} of the late ${v.deceasedName} (hereinafter "the Claimant"), in favour of ${v.institution} (hereinafter "the Institution").`,
        "",
        "WHEREAS:",
        `  (a) ${v.deceasedName} (hereinafter "the Deceased") expired on ${
          v.dateOfDeath ?? "________"
        }${v.domicileState ? `, ordinarily resident in ${v.domicileState}` : ""}.`,
        `  (b) The Deceased held ${
          v.accountOrPolicyNo ? `account/policy no. ${v.accountOrPolicyNo}` : "an account/asset"
        } with the Institution${
          v.approxValue ? ` of an approximate value of ${formatINR(v.approxValue)}` : ""
        }.`,
        "  (c) The Claimant has requested the Institution to release the said amount without insisting upon a succession certificate or probate.",
        "",
        "NOW THIS DEED WITNESSES that in consideration of the Institution settling the claim, the Claimant hereby agrees and undertakes:",
        "  1. To indemnify and keep indemnified the Institution against all claims, demands, costs and losses that may arise by reason of the Institution settling the claim in favour of the Claimant.",
        "  2. That the statements made by the Claimant in connection with this claim are true and correct.",
        ...(v.heirs && v.heirs.length
          ? [
              `  3. That the legal heirs of the Deceased are: ${v.heirs.join(
                ", ",
              )}, and the necessary No-Objection has been obtained from those not claiming.`,
            ]
          : []),
        "",
        "IN WITNESS WHEREOF the Claimant has signed this deed on the date first written above.",
      ],
      signature: [
        "Signed and delivered by the Claimant,",
        "",
        `${v.claimantName} (Claimant)`,
        "",
        "Witnesses:",
        "  1. ____________________",
        "  2. ____________________",
      ],
    };
  },
};
