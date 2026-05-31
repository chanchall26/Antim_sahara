/**
 * Gemini client (server-side ONLY — never import into client components).
 * Uses @google/genai. When GEMINI_API_KEY is absent, geminiEnabled is false and
 * callers fall back to deterministic/cached output.
 */
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
export const geminiEnabled = Boolean(apiKey);

/** Override with GEMINI_MODEL. Default is a current, free-tier multimodal model. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const ai = geminiEnabled ? new GoogleGenAI({ apiKey: apiKey! }) : null;

export interface InlineFile {
  /** base64 (no data: prefix) */
  data: string;
  mimeType: string;
}

/** Plain text generation (e.g. warm explanation rewriting). */
export async function generateText(prompt: string, system?: string): Promise<string | null> {
  if (!ai) return null;
  try {
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: system ? { systemInstruction: system } : undefined,
    });
    return res.text ?? null;
  } catch (err) {
    console.error("[gemini] generateText failed:", err);
    return null;
  }
}

/**
 * Structured JSON generation. Returns the raw parsed object (validate with zod in the caller).
 * Accepts optional inline files for multimodal OCR (death certificate, passbook…).
 */
export async function generateStructured<T = unknown>(
  prompt: string,
  opts?: { system?: string; files?: InlineFile[] },
): Promise<T | null> {
  if (!ai) return null;
  try {
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    for (const f of opts?.files ?? []) {
      parts.push({ inlineData: { data: f.data, mimeType: f.mimeType } });
    }
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        ...(opts?.system ? { systemInstruction: opts.system } : {}),
      },
    });
    const text = res.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[gemini] generateStructured failed:", err);
    return null;
  }
}
