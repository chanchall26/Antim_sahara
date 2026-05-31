import type { TemplateDef, RenderedTemplate, TemplateVars } from "./types";

const today = (v: TemplateVars) => v.date ?? new Date().toISOString().slice(0, 10);

export const heirshipAffidavit: TemplateDef = {
  key: "heirship_affidavit",
  label: "Affidavit of heirship",
  docType: "affidavit",
  render: (v): RenderedTemplate => ({
    title: "Affidavit of Heirship",
    docType: "affidavit",
    subject: "(To be sworn before a Notary / Oath Commissioner / Magistrate on stamp paper)",
    body: [
      `I, ${v.claimantName}, ${v.claimantRelationship} of the late ${v.deceasedName}, do hereby solemnly affirm and declare as under:`,
      "",
      `  1. That ${v.deceasedName} expired on ${v.dateOfDeath ?? "________"}${
        v.domicileState ? ` at ${v.domicileState}` : ""
      }.`,
      "  2. That the deceased died intestate (without leaving a will).",
      ...(v.heirs && v.heirs.length
        ? [`  3. That the legal heirs of the deceased are: ${v.heirs.join(", ")}, and there is no other heir.`]
        : ["  3. That I am a lawful legal heir of the deceased and there is no other heir excluded herein."]),
      "  4. That this affidavit is made to enable the settlement/transfer of the deceased's assets.",
      "",
      `Verified at __________ on ${today(v)} that the contents above are true to the best of my knowledge.`,
    ],
    signature: ["", `${v.claimantName}`, "(Deponent)"],
  }),
};

export const heirNoc: TemplateDef = {
  key: "heir_noc",
  label: "No-Objection Certificate from a co-heir",
  docType: "noc",
  render: (v): RenderedTemplate => ({
    title: "No-Objection Certificate (NOC)",
    docType: "noc",
    body: [
      `Date: ${today(v)}`,
      "",
      `I, ____________________, being a legal heir of the late ${v.deceasedName}, hereby state that I have NO OBJECTION to the settlement/transfer of the deceased's ${
        v.accountOrPolicyNo ? `asset bearing no. ${v.accountOrPolicyNo} ` : "assets "
      }held with ${v.institution} in favour of ${v.claimantName} (${v.claimantRelationship} of the deceased).`,
      "",
      "I confirm that I relinquish any claim to the said asset to the extent necessary for this settlement, and I shall raise no dispute in this regard.",
    ],
    signature: ["", "____________________", "(Co-heir / Signatory)", "", "Witness: ____________________"],
  }),
};

export const successionPetition: TemplateDef = {
  key: "succession_petition",
  label: "Succession Certificate petition (draft)",
  docType: "succession_cert",
  render: (v): RenderedTemplate => ({
    title: "Petition for Grant of Succession Certificate",
    docType: "succession_cert",
    to: [
      "IN THE COURT OF THE DISTRICT JUDGE",
      v.domicileState ? `${v.domicileState}` : "____________",
    ],
    subject:
      "Petition under Section 372 of the Indian Succession Act, 1925 for grant of a Succession Certificate",
    body: [
      "The Petitioner respectfully submits as follows:",
      "",
      `  1. That ${v.deceasedName} (the deceased) died on ${
        v.dateOfDeath ?? "________"
      }${v.domicileState ? `, ordinarily residing at ${v.domicileState}` : ""}.`,
      `  2. That the Petitioner, ${v.claimantName}, is the ${v.claimantRelationship} of the deceased and a lawful heir.`,
      ...(v.heirs && v.heirs.length
        ? [`  3. That the heirs of the deceased are: ${v.heirs.join(", ")}.`]
        : ["  3. That the heirs of the deceased are as listed in the schedule annexed."]),
      "  4. That the deceased left the debts and securities described in the Schedule below, in respect of which this certificate is sought.",
      "  5. That no application for a succession certificate has been made to any other court.",
      "",
      "SCHEDULE OF DEBTS AND SECURITIES:",
      `  - ${v.institution}${v.accountOrPolicyNo ? `, no. ${v.accountOrPolicyNo}` : ""}${
        v.approxValue ? `, approx. value ₹${v.approxValue.toLocaleString("en-IN")}` : ""
      }`,
      "",
      "PRAYER: The Petitioner prays that this Hon'ble Court be pleased to grant a Succession Certificate in respect of the above debts and securities.",
    ],
    signature: ["", `${v.claimantName}`, "(Petitioner)", "Through Counsel: ____________________"],
  }),
};

export const insuranceClaimLetter: TemplateDef = {
  key: "insurance_claim_letter",
  label: "Insurance death-claim cover letter",
  docType: "generated_letter",
  render: (v): RenderedTemplate => ({
    title: "Insurance Death Claim — Cover Letter",
    docType: "generated_letter",
    to: ["To,", "The Claims Department", v.institution],
    subject: `Death claim under policy ${v.accountOrPolicyNo ?? "________"} of the late ${v.deceasedName}`,
    body: [
      `Date: ${today(v)}`,
      "",
      "Respected Sir/Madam,",
      "",
      `I, ${v.claimantName}, ${v.claimantRelationship} and nominee/claimant of the late ${v.deceasedName} (policy no. ${
        v.accountOrPolicyNo ?? "________"
      }), wish to lodge a death claim under the said policy. The life assured passed away on ${
        v.dateOfDeath ?? "________"
      }.`,
      "",
      "I enclose: the original policy bond, a certified death certificate, the completed claim form, and my identity/bank proof. Kindly process the claim within the IRDAI service timeline.",
    ],
    signature: ["Yours faithfully,", "", v.claimantName, `(${v.claimantRelationship} of the life assured)`],
  }),
};
