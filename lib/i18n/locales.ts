/**
 * Supported languages. The first five are FULLY translated (the most-spoken in India).
 * The rest are shown in the dropdown and gracefully fall back to English/Hindi.
 */
export interface LocaleMeta {
  code: string;
  /** Name in the language's own script. */
  native: string;
  /** Name in English. */
  english: string;
  /** Fully translated UI? */
  full: boolean;
}

export const LOCALES: LocaleMeta[] = [
  { code: "en", native: "English", english: "English", full: true },
  { code: "hi", native: "हिन्दी", english: "Hindi", full: true },
  { code: "bn", native: "বাংলা", english: "Bengali", full: true },
  { code: "mr", native: "मराठी", english: "Marathi", full: true },
  { code: "te", native: "తెలుగు", english: "Telugu", full: true },
  // Dropdown-only (fall back to English):
  { code: "ta", native: "தமிழ்", english: "Tamil", full: false },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati", full: false },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", full: false },
  { code: "ml", native: "മലയാളം", english: "Malayalam", full: false },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi", full: false },
  { code: "or", native: "ଓଡ଼ିଆ", english: "Odia", full: false },
  { code: "ur", native: "اردو", english: "Urdu", full: false },
  { code: "as", native: "অসমীয়া", english: "Assamese", full: false },
];

export const DEFAULT_LOCALE = "en";

export function getLocaleMeta(code: string): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

export function isRtl(code: string): boolean {
  return code === "ur";
}
