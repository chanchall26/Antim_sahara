import type { AssetType, Relationship, Religion } from "@/types";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Jammu & Kashmir",
  "Chandigarh",
  "Puducherry",
];

export const RELIGION_OPTIONS: Religion[] = ["hindu", "muslim", "christian", "parsi", "other"];

export const RELATIONSHIP_OPTIONS: Relationship[] = [
  "spouse",
  "son",
  "daughter",
  "parent",
  "sibling",
  "grandchild",
  "other",
];

export const ASSET_TYPE_OPTIONS: AssetType[] = [
  "bank_account",
  "epf",
  "insurance",
  "mutual_fund",
  "demat",
  "pension",
  "property",
  "other",
];

/** Asset types where a nominee question is meaningful. */
export const NOMINEE_RELEVANT: AssetType[] = [
  "bank_account",
  "insurance",
  "mutual_fund",
  "demat",
  "epf",
];
