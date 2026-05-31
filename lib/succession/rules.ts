/**
 * Deterministic legal branching for Indian post-death asset settlement.
 *
 * GUIDANCE ONLY — every threshold/fee is a CONFIG constant marked "// VERIFY".
 * Sources: RBI Settlement of Claims Directions 2025; SEBI transmission thresholds (2022);
 * EPFO EDLI (CBT Apr 2024); Indian Succession Act 1925; Hindu Succession Act 1956.
 */
import { CONFIG } from "@/lib/config";
import type { AdvisorNote, Asset, Deceased, Religion, TaskCategory } from "@/types";

/** The instrument a claimant needs to collect/transfer an asset. */
export const INSTRUMENT = {
  NOMINEE: "Nominee / survivor route",
  SIMPLIFIED: "Simplified (small-value) route",
  SUCCESSION_CERT: "Succession Certificate",
  PROBATE: "Probate of the will",
  LOA: "Letters of Administration",
  LEGAL_HEIR_CERT: "Legal Heir Certificate",
  EPFO_FORMS: "EPFO death-claim forms",
  INSURANCE_CLAIM: "Insurer death-claim",
} as const;

/** Plain-language class-of-heirs explanation, branching by personal law. */
export function heirClassExplanation(religion: Religion): string {
  switch (religion) {
    case "hindu":
      return "Under the Hindu Succession Act 1956, Class I heirs inherit equally and at the same time — typically the spouse, sons, daughters and mother. Since the 2005 amendment, daughters are coparceners with rights equal to sons.";
    case "muslim":
      return "Under Muslim personal law, the estate is divided among sharers and residuaries by fixed fractions (for example a widow takes 1/8 with children, 1/4 without; a daughter takes half a son's share). Up to 1/3 may be left by will.";
    case "christian":
      return "Under the Indian Succession Act 1925 (s.33), the spouse usually takes one-third and the children two-thirds; with no children, the spouse takes half and other kindred the rest.";
    case "parsi":
      return "Under the Indian Succession Act 1925 (ss.50–53), the widow/widower and each child take equal shares, and parents take a half-share.";
    default:
      return "Intestate succession depends on the applicable personal law. Please confirm the class of heirs with a local authority or lawyer.";
  }
}

const VERIFY = "Figures vary by state and institution — please verify with the relevant office.";

/** Map an asset type to the roadmap task category. */
function categoryForAsset(asset: Asset): TaskCategory {
  switch (asset.type) {
    case "bank_account":
      return "bank";
    case "epf":
      return "epfo";
    case "insurance":
      return "insurance";
    case "mutual_fund":
    case "demat":
      return "mutualfund";
    case "pension":
      return "pension";
    default:
      return "succession";
  }
}

/** Decide the instrument + reason for one asset. */
export function evaluateAsset(asset: Asset, deceased: Deceased): AdvisorNote {
  const category = categoryForAsset(asset);
  const heirClass = heirClassExplanation(deceased.religion);

  // ---- Bank accounts (RBI 2025) ----
  if (asset.type === "bank_account") {
    if (asset.hasNominee || asset.jointHolder) {
      return {
        assetId: asset.id,
        category,
        instrument: INSTRUMENT.NOMINEE,
        reason:
          "A nominee or 'either or survivor' is on record, so the bank pays out on just the claim form, death certificate and claimant ID — no succession certificate, whatever the amount (RBI 2025). " +
          VERIFY,
        heirClass,
      };
    }
    if ((asset.approxValue ?? 0) <= CONFIG.BANK_THRESHOLD_COMMERCIAL) {
      return {
        assetId: asset.id,
        category,
        instrument: INSTRUMENT.SIMPLIFIED,
        reason: `No nominee is on record, but the balance is within the simplified-settlement threshold (about ₹15 lakh for commercial banks, ₹5 lakh for co-operative banks). You can claim with a claim form, death certificate, ID, an indemnity bond, a Legal Heir Certificate/affidavit, and an NOC from other heirs. ${VERIFY}`,
        heirClass,
      };
    }
    return {
      assetId: asset.id,
      category,
      instrument: deceased.hadWill ? INSTRUMENT.PROBATE : INSTRUMENT.SUCCESSION_CERT,
      reason: deceased.hadWill
        ? `The balance is above the simplified threshold and a will exists, so the bank will usually need probate of the will (or Letters of Administration if there is no executor). ${VERIFY}`
        : `The balance is above the simplified threshold and there is no nominee or will, so a Succession Certificate from the District Court is generally required for these funds. ${VERIFY}`,
      heirClass,
    };
  }

  // ---- EPF / EPFO ----
  if (asset.type === "epf") {
    return {
      assetId: asset.id,
      category,
      instrument: INSTRUMENT.EPFO_FORMS,
      reason:
        "EPFO benefits are claimed through the last employer using Form 20 (PF balance), Form 10D (monthly family pension) and Form 5IF (EDLI insurance, minimum ₹2.5 lakh / maximum ₹7 lakh). No succession certificate is needed — these use the nomination or legal-heir route. " +
        VERIFY,
      heirClass,
    };
  }

  // ---- Insurance ----
  if (asset.type === "insurance") {
    return {
      assetId: asset.id,
      category,
      instrument: INSTRUMENT.INSURANCE_CLAIM,
      reason:
        "Life-insurance death claims need the claim form, the original policy bond, the death certificate and claimant ID/bank proof. IRDAI norms expect settlement within about 30 days. " +
        VERIFY,
      heirClass,
    };
  }

  // ---- Mutual funds / demat (SEBI 2022) ----
  if (asset.type === "mutual_fund" || asset.type === "demat") {
    const threshold =
      asset.type === "demat" ? CONFIG.SEBI_THRESHOLD_DEMAT : CONFIG.SEBI_THRESHOLD_PHYSICAL;
    if (asset.hasNominee || asset.jointHolder) {
      return {
        assetId: asset.id,
        category,
        instrument: INSTRUMENT.NOMINEE,
        reason:
          "A nominee/joint holder is registered, so units transmit on a Transmission Request Form + attested death certificate + nominee KYC — usually within about 7 working days. " +
          VERIFY,
        heirClass,
      };
    }
    if ((asset.approxValue ?? 0) <= threshold) {
      return {
        assetId: asset.id,
        category,
        instrument: INSTRUMENT.SIMPLIFIED,
        reason: `Within SEBI's simplified-transmission threshold (about ₹5 lakh per physical issuer / ₹15 lakh per demat account), you can transmit with a Transmission Request Form, death certificate, affidavit, indemnity bond and NOC from other heirs. A Legal Heir Certificate is accepted here. ${VERIFY}`,
        heirClass,
      };
    }
    return {
      assetId: asset.id,
      category,
      instrument: deceased.hadWill ? INSTRUMENT.PROBATE : INSTRUMENT.SUCCESSION_CERT,
      reason: `Above SEBI's simplified threshold, a ${deceased.hadWill ? "probate" : "Succession Certificate"} is generally required to transmit these securities. ${VERIFY}`,
      heirClass,
    };
  }

  // ---- Pension ----
  if (asset.type === "pension") {
    return {
      assetId: asset.id,
      category,
      instrument: INSTRUMENT.LEGAL_HEIR_CERT,
      reason:
        "Family pension generally goes to the spouse first (for life unless disqualified), then eligible children. It uses the pension forms and a Legal Heir Certificate, not a succession certificate. After the primary pensioner's death, the family pensioner must submit their own Jeevan Pramaan digital life certificate yearly. " +
        VERIFY,
      heirClass,
    };
  }

  // ---- Property / other ----
  if (asset.type === "property") {
    return {
      assetId: asset.id,
      category: "succession",
      instrument: deceased.hadWill ? INSTRUMENT.PROBATE : INSTRUMENT.LEGAL_HEIR_CERT,
      reason: deceased.hadWill
        ? `Immovable property under a will may need probate (mandatory in Mumbai/Chennai/Kolkata jurisdictions); afterwards apply for mutation at the local sub-registrar/revenue office. ${VERIFY}`
        : `For property without a will, obtain a Legal Heir Certificate and apply for mutation/transfer at the revenue office. A Succession Certificate does NOT cover immovable property. ${VERIFY}`,
      heirClass,
    };
  }

  return {
    assetId: asset.id,
    category: "succession",
    instrument: INSTRUMENT.LEGAL_HEIR_CERT,
    reason: "Confirm the correct instrument for this asset with the holding institution. " + VERIFY,
    heirClass,
  };
}

/** Produce advisor notes for the whole case. */
export function buildAdvice(deceased: Deceased, assets: Asset[]): AdvisorNote[] {
  const notes = assets.map((a) => evaluateAsset(a, deceased));
  // Always include a succession-overview note.
  notes.unshift({
    category: "succession",
    instrument: deceased.hadWill ? INSTRUMENT.PROBATE : "Intestate succession",
    reason: deceased.hadWill
      ? "A will exists. Financial institutions may act on an undisputed will, but courts/banks often ask for probate (mandatory in the presidency-town jurisdictions). Keep the original will safe. " +
        VERIFY
      : "There is no will, so assets pass by intestate succession under the applicable personal law. " +
        VERIFY,
    heirClass: heirClassExplanation(deceased.religion),
  });
  return notes;
}
