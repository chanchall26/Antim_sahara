import { z } from "zod";

/** Death-certificate OCR extraction. */
export const deathCertSchema = z.object({
  deceasedName: z.string(),
  dateOfDeath: z.string().optional(),
  dateOfBirth: z.string().optional(),
  place: z.string().optional(),
  registrationNo: z.string().optional(),
  fatherOrSpouseName: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.6),
});
export type DeathCertParsed = z.infer<typeof deathCertSchema>;

/** Warm, plain-language enrichment returned for a single advisor note. */
export const enrichedAdviceSchema = z.object({
  warmExplanation: z.string(),
  steps: z.array(z.string()).optional(),
});
export type EnrichedAdvice = z.infer<typeof enrichedAdviceSchema>;

/** Prompt instructing Gemini to return the death-cert JSON shape. */
export const DEATH_CERT_PROMPT = `You are reading an Indian death certificate (or a photo of one).
Extract these fields and return ONLY a JSON object with this exact shape:
{
  "deceasedName": string,
  "dateOfDeath": string (yyyy-mm-dd if possible),
  "dateOfBirth": string (optional, yyyy-mm-dd),
  "place": string (optional),
  "registrationNo": string (optional),
  "fatherOrSpouseName": string (optional),
  "confidence": number between 0 and 1
}
If a field is unreadable, omit it. Do not invent values. Return JSON only, no prose.`;
