/**
 * State-specific micro-details: courts, registration portals, and Google Maps links.
 * Bilingual (English + Hindi). Madhya Pradesh is fully detailed; others use a generic
 * fallback. Extend STATE_INFO with more states over time.
 *
 * GUIDANCE only — verify addresses, jurisdictions and fees with the relevant office.
 */

export interface MapPlace {
  label: string;
  labelHi: string;
  /** Google Maps deep link. */
  mapUrl: string;
  /** Optional address line. */
  address?: string;
  addressHi?: string;
}

export interface PortalLink {
  label: string;
  labelHi: string;
  desc: string;
  descHi: string;
  url: string;
}

export interface StateInfo {
  state: string;
  stateHi: string;
  highCourt: {
    name: string;
    nameHi: string;
    seat: MapPlace;
    benches: MapPlace[];
  };
  districtCourts: MapPlace[];
  portals: PortalLink[];
  notes: { en: string; hi: string }[];
}

/** Build a Google Maps search deep-link from a place query. */
export function gmap(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const MADHYA_PRADESH: StateInfo = {
  state: "Madhya Pradesh",
  stateHi: "मध्य प्रदेश",
  highCourt: {
    name: "High Court of Madhya Pradesh",
    nameHi: "मध्य प्रदेश उच्च न्यायालय",
    seat: {
      label: "Principal Seat — Jabalpur",
      labelHi: "मुख्य पीठ — जबलपुर",
      address: "High Court of M.P., South Civil Lines, Jabalpur – 482001",
      addressHi: "उच्च न्यायालय म.प्र., साउथ सिविल लाइंस, जबलपुर – 482001",
      mapUrl: gmap("High Court of Madhya Pradesh Jabalpur"),
    },
    benches: [
      {
        label: "Bench at Indore",
        labelHi: "खंडपीठ — इंदौर",
        address: "M.P. High Court Bench, Indore",
        addressHi: "म.प्र. उच्च न्यायालय खंडपीठ, इंदौर",
        mapUrl: gmap("Madhya Pradesh High Court Indore Bench"),
      },
      {
        label: "Bench at Gwalior",
        labelHi: "खंडपीठ — ग्वालियर",
        address: "M.P. High Court Bench, Gwalior",
        addressHi: "म.प्र. उच्च न्यायालय खंडपीठ, ग्वालियर",
        mapUrl: gmap("Madhya Pradesh High Court Gwalior Bench"),
      },
    ],
  },
  districtCourts: [
    { label: "District Court, Bhopal", labelHi: "जिला न्यायालय, भोपाल", mapUrl: gmap("District Court Bhopal") },
    { label: "District Court, Indore", labelHi: "जिला न्यायालय, इंदौर", mapUrl: gmap("District Court Indore") },
    { label: "District Court, Jabalpur", labelHi: "जिला न्यायालय, जबलपुर", mapUrl: gmap("District Court Jabalpur") },
    { label: "District Court, Gwalior", labelHi: "जिला न्यायालय, ग्वालियर", mapUrl: gmap("District Court Gwalior") },
    { label: "District Court, Ujjain", labelHi: "जिला न्यायालय, उज्जैन", mapUrl: gmap("District Court Ujjain") },
  ],
  portals: [
    {
      label: "MP e-Nagar Palika (death registration)",
      labelHi: "एमपी ई-नगर पालिका (मृत्यु पंजीकरण)",
      desc: "Register the death and download the certificate online for urban areas.",
      descHi: "शहरी क्षेत्रों के लिए मृत्यु पंजीकरण करें और प्रमाणपत्र ऑनलाइन डाउनलोड करें।",
      url: "https://www.mpenagarpalika.gov.in/",
    },
    {
      label: "MP Lok Seva (Legal Heir / certificates)",
      labelHi: "एमपी लोक सेवा (उत्तराधिकारी प्रमाणपत्र)",
      desc: "Apply for a Legal Heir Certificate via the Lok Seva Guarantee / Tehsildar.",
      descHi: "लोक सेवा गारंटी / तहसीलदार के माध्यम से उत्तराधिकारी प्रमाणपत्र के लिए आवेदन करें।",
      url: "https://www.mpedistrict.gov.in/",
    },
    {
      label: "MP District Courts (e-Courts)",
      labelHi: "एमपी जिला न्यायालय (ई-कोर्ट्स)",
      desc: "Case status, cause lists and e-filing for Succession Certificate petitions.",
      descHi: "उत्तराधिकार प्रमाणपत्र याचिकाओं हेतु केस स्थिति, कॉज़ लिस्ट व ई-फाइलिंग।",
      url: "https://districts.ecourts.gov.in/madhya-pradesh",
    },
    {
      label: "CRS Portal (national death register)",
      labelHi: "सीआरएस पोर्टल (राष्ट्रीय मृत्यु पंजी)",
      desc: "Central civil-registration portal for the digital death certificate.",
      descHi: "डिजिटल मृत्यु प्रमाणपत्र हेतु केंद्रीय नागरिक पंजीकरण पोर्टल।",
      url: "https://dc.crsorgi.gov.in/",
    },
  ],
  notes: [
    {
      en: "The MP High Court's principal seat is at Jabalpur, with benches at Indore and Gwalior. Choose the bench for your region.",
      hi: "मध्य प्रदेश उच्च न्यायालय की मुख्य पीठ जबलपुर में है, तथा खंडपीठें इंदौर और ग्वालियर में हैं। अपने क्षेत्र की खंडपीठ चुनें।",
    },
    {
      en: "Register the death within 21 days (free) at your Nagar Nigam / Nagar Palika / Gram Panchayat, or online via MP e-Nagar Palika.",
      hi: "मृत्यु का पंजीकरण 21 दिनों के भीतर (निःशुल्क) अपने नगर निगम / नगर पालिका / ग्राम पंचायत में, या एमपी ई-नगर पालिका पर ऑनलाइन कराएँ।",
    },
    {
      en: "For a Legal Heir Certificate, apply at the Tehsildar / SDM office (revenue) through MP Lok Seva. For a Succession Certificate, file in the District Court where the deceased ordinarily resided.",
      hi: "उत्तराधिकारी प्रमाणपत्र हेतु तहसीलदार / एसडीएम कार्यालय (राजस्व) में एमपी लोक सेवा के माध्यम से आवेदन करें। उत्तराधिकार प्रमाणपत्र हेतु उस जिला न्यायालय में याचिका दायर करें जहाँ मृतक सामान्यतः रहते थे।",
    },
  ],
};

export const STATE_INFO: Record<string, StateInfo> = {
  "Madhya Pradesh": MADHYA_PRADESH,
};

export function getStateInfo(state?: string): StateInfo | null {
  if (!state) return null;
  return STATE_INFO[state] ?? null;
}
