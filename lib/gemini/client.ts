/**
 * Gemini client (server-side ONLY — never import into client components).
 *
 * Supports MULTIPLE API keys with automatic round-robin + failover: when a key hits a
 * rate limit (429 / RESOURCE_EXHAUSTED) or errors, the next key is tried automatically.
 * Configure via either:
 *   GEMINI_API_KEYS=key1,key2,key3        (comma-separated — easiest)
 *   GEMINI_API_KEY=key1                    (single)
 *   GEMINI_API_KEY_2=...  GEMINI_API_KEY_3=...  (numbered, up to _10)
 */
import { GoogleGenAI } from "@google/genai";

function loadKeys(): string[] {
  const out: string[] = [];
  const single = process.env.GEMINI_API_KEY?.trim();
  if (single) out.push(single);
  for (const k of (process.env.GEMINI_API_KEYS || "").split(",")) {
    const t = k.trim();
    if (t) out.push(t);
  }
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (k) out.push(k);
  }
  return [...new Set(out)];
}

const KEYS = loadKeys();
export const geminiEnabled = KEYS.length > 0;
export const geminiKeyCount = KEYS.length;

/** Override with GEMINI_MODEL. Default is a current, free-tier multimodal model. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const clients = new Map<string, GoogleGenAI>();
function clientFor(key: string): GoogleGenAI {
  let c = clients.get(key);
  if (!c) {
    c = new GoogleGenAI({ apiKey: key });
    clients.set(key, c);
  }
  return c;
}

// Round-robin cursor so load spreads across keys across requests.
let cursor = 0;

function isRateLimit(err: unknown): boolean {
  const s = String((err as { message?: string })?.message ?? err);
  const status = (err as { status?: number })?.status;
  return status === 429 || /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(s);
}

/** Run a Gemini call, trying each key until one succeeds. Returns null if all fail. */
async function withFailover<T>(fn: (ai: GoogleGenAI) => Promise<T>): Promise<T | null> {
  if (!geminiEnabled) return null;
  const n = KEYS.length;
  for (let attempt = 0; attempt < n; attempt++) {
    const idx = (cursor + attempt) % n;
    try {
      const result = await fn(clientFor(KEYS[idx]));
      cursor = (idx + 1) % n; // advance for next request
      return result;
    } catch (err) {
      const rl = isRateLimit(err);
      console.error(
        `[gemini] key #${idx + 1}/${n} failed${rl ? " (rate-limited, trying next)" : ""}:`,
        (err as { message?: string })?.message ?? err,
      );
      if (rl) cursor = (idx + 1) % n; // skip the exhausted key next time
      // continue to next key
    }
  }
  console.error("[gemini] all keys failed — falling back to cached/deterministic output.");
  return null;
}

export interface InlineFile {
  /** base64 (no data: prefix) */
  data: string;
  mimeType: string;
}

/** Plain text generation (e.g. warm explanation rewriting). */
export async function generateText(prompt: string, system?: string): Promise<string | null> {
  return withFailover(async (ai) => {
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: system ? { systemInstruction: system } : undefined,
    });
    return res.text ?? null;
  });
}

/**
 * Structured JSON generation. Returns the raw parsed object (validate with zod in the caller).
 * Accepts optional inline files for multimodal OCR (death certificate, passbook…).
 */
export async function generateStructured<T = unknown>(
  prompt: string,
  opts?: { system?: string; files?: InlineFile[] },
): Promise<T | null> {
  return withFailover(async (ai) => {
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
  });
}
