import { NextRequest, NextResponse } from "next/server";
import { buildAdvice } from "@/lib/succession/rules";
import { DEMO_MODE } from "@/lib/config";
import { geminiEnabled, generateText } from "@/lib/gemini/client";
import type { Asset, Deceased } from "@/types";

export const runtime = "nodejs";

interface Body {
  deceased: Deceased;
  assets: Asset[];
  language?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.deceased?.religion) {
    return NextResponse.json({ error: "Missing deceased details" }, { status: 400 });
  }

  const notes = buildAdvice(body.deceased, body.assets ?? []);

  let warmIntro: string | null = null;
  if (!DEMO_MODE && geminiEnabled) {
    warmIntro = await generateText(
      `In two warm, simple sentences (${
        body.language === "hi" ? "Hindi" : "English"
      }), reassure a grieving family that you will guide them through the ${notes.length} steps ahead. No legal jargon.`,
      "You are a compassionate bereavement assistant.",
    );
  }

  return NextResponse.json({ notes, warmIntro, meta: { gemini: geminiEnabled, demo: DEMO_MODE } });
}
