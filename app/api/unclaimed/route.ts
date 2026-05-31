/**
 * Trace-unclaimed-money agent.
 * Returns the official portals + a tailored, ordered "search packet" for the family.
 * Deterministic (no key needed); Gemini can add a warm intro when configured.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface Body {
  deceasedName?: string;
  pan?: string;
  hasShares?: boolean;
  hasInsurance?: boolean;
  hasBank?: boolean;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* allow empty */
  }

  const packet = [
    {
      key: "udgam",
      title: "Unclaimed bank deposits — RBI UDGAM",
      url: "https://udgam.rbi.org.in/",
      why: "Inactive accounts and matured deposits move to the RBI's DEA Fund (₹74,000+ crore). UDGAM searches across banks at once.",
      steps: [
        "Register on UDGAM with a mobile number.",
        `Search using the deceased's name${body.pan ? " and PAN" : ""} and known banks.`,
        "Note any matches, then approach that bank with the death certificate to claim.",
      ],
      relevant: body.hasBank !== false,
    },
    {
      key: "bima",
      title: "Unclaimed insurance — IRDAI Bima Bharosa",
      url: "https://bimabharosa.irdai.gov.in/",
      why: "Forgotten policies and maturity amounts (₹1,000+) must be listed by insurers; older amounts move to the Senior Citizens' Welfare Fund.",
      steps: [
        "Open Bima Bharosa and use the unclaimed-amount search.",
        "Search by policy number, PAN, name and date of birth.",
        "For a match, lodge a death/maturity claim with that insurer.",
      ],
      relevant: body.hasInsurance !== false,
    },
    {
      key: "iepf",
      title: "Unclaimed shares & dividends — IEPF (Form IEPF-5)",
      url: "https://www.iepf.gov.in/",
      why: "Shares and dividends unclaimed for 7 years move to the IEPF; legal heirs can recover them.",
      steps: [
        "First complete transmission with the company (death certificate + heir proof).",
        "File Form IEPF-5 online; it generates an SRN.",
        "Send originals to the company's Nodal Officer; the Authority disposes within ~60 days.",
      ],
      relevant: Boolean(body.hasShares),
    },
  ];

  return NextResponse.json({ packet: packet.filter((p) => p.relevant || p.key !== "iepf") });
}
