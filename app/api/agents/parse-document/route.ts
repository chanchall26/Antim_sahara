import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/config";
import { geminiEnabled, generateStructured } from "@/lib/gemini/client";
import { deathCertSchema, DEATH_CERT_PROMPT } from "@/lib/gemini/schemas";
import { CACHED_DEATH_CERT } from "@/lib/demo/cachedResponses";

export const runtime = "nodejs";

interface Body {
  /** base64 file data (no data: prefix) */
  data?: string;
  mimeType?: string;
  docType?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Demo mode (or no key / no file): return the hand-checked cached extraction.
  if (DEMO_MODE || !geminiEnabled || !body.data) {
    return NextResponse.json({
      extracted: CACHED_DEATH_CERT,
      source: DEMO_MODE ? "demo-cache" : geminiEnabled ? "no-file" : "no-key",
    });
  }

  const raw = await generateStructured(DEATH_CERT_PROMPT, {
    files: [{ data: body.data, mimeType: body.mimeType ?? "image/jpeg" }],
    system: "You are an OCR + extraction assistant for Indian civil documents. Return JSON only.",
  });

  const parsed = deathCertSchema.safeParse(raw);
  if (!parsed.success) {
    // Fall back gracefully so the UI never breaks.
    return NextResponse.json({ extracted: CACHED_DEATH_CERT, source: "fallback" });
  }
  return NextResponse.json({ extracted: parsed.data, source: "gemini" });
}
