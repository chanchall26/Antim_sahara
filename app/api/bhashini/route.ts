/**
 * Vernacular voice/translation endpoint.
 * Strategy: Bhashini (MeitY) for authentic Indic ASR/TTS/translation when credentials exist;
 * Gemini multilingual as a fallback for translation. Browser Web Speech API handles TTS
 * client-side so the demo always has a voice, even with no credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import { geminiEnabled, generateText } from "@/lib/gemini/client";

export const runtime = "nodejs";

const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID;
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY;
const bhashiniEnabled = Boolean(BHASHINI_USER_ID && BHASHINI_API_KEY);

interface Body {
  text: string;
  targetLang: string; // e.g. "hi", "bn"
  task?: "translate";
}

const LANG_NAMES: Record<string, string> = {
  hi: "Hindi",
  bn: "Bengali",
  mr: "Marathi",
  te: "Telugu",
  ta: "Tamil",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
  en: "English",
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  // Same language → no translation needed.
  if (!body.targetLang || body.targetLang === "en") {
    return NextResponse.json({ text: body.text, provider: "none" });
  }

  // Gemini fallback translation (Bhashini integration point is documented in README).
  if (geminiEnabled) {
    const translated = await generateText(
      `Translate the following into ${LANG_NAMES[body.targetLang] ?? body.targetLang}. Keep it warm and simple. Return only the translation:\n\n${body.text}`,
      "You are a careful translator for compassionate, plain-language content.",
    );
    if (translated) return NextResponse.json({ text: translated, provider: "gemini" });
  }

  // No provider available — return original; client TTS can still read it.
  return NextResponse.json({
    text: body.text,
    provider: bhashiniEnabled ? "bhashini-unconfigured" : "none",
    note: "Wire Bhashini ULCA pipeline here for production ASR/TTS.",
  });
}
