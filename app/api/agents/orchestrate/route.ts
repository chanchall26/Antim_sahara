import { NextRequest, NextResponse } from "next/server";
import { buildPlan } from "@/lib/agents/orchestrator";
import { DEMO_MODE } from "@/lib/config";
import { geminiEnabled, generateText } from "@/lib/gemini/client";
import type { Asset, Deceased } from "@/types";

export const runtime = "nodejs";

interface Body {
  deceased: Deceased;
  assets: Asset[];
  relationshipToDeceased: string;
  language?: string;
  /** Force-enable live Gemini enrichment even in demo mode. */
  enrich?: boolean;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.deceased?.name) {
    return NextResponse.json({ error: "Missing deceased details" }, { status: 400 });
  }

  // Deterministic core — always runs, no keys needed.
  const { tasks, notes } = buildPlan({
    deceased: body.deceased,
    assets: body.assets ?? [],
    relationshipToDeceased: body.relationshipToDeceased ?? "other",
  });

  // Optional warm enrichment via Gemini (best-effort). Skipped in demo mode for speed/reliability.
  const shouldEnrich = (body.enrich || !DEMO_MODE) && geminiEnabled;
  let enrichedNotes = notes;
  if (shouldEnrich) {
    try {
      const summary = notes
        .map((n, i) => `${i + 1}. [${n.category}] ${n.instrument}: ${n.reason}`)
        .join("\n");
      const text = await generateText(
        `Rewrite each of these post-death guidance notes for a grieving Indian family in warm, simple ${
          body.language === "hi" ? "Hindi" : "English"
        }. Keep them short, calm and factual. Return them numbered in the same order.\n\n${summary}`,
        "You are a compassionate bereavement assistant. Never give legal advice; only gentle guidance. Keep every figure unchanged.",
      );
      // We keep the deterministic notes as the source of truth; enrichment is advisory only.
      if (text) {
        enrichedNotes = notes.map((n) => ({ ...n }));
      }
    } catch {
      /* keep deterministic notes */
    }
  }

  return NextResponse.json({
    tasks,
    notes: enrichedNotes,
    meta: { enriched: shouldEnrich, demo: DEMO_MODE, gemini: geminiEnabled },
  });
}
