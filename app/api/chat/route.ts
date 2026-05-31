import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/lib/chat/engine";
import type { ChatRequest } from "@/lib/chat/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  // Trim to the recent tail and cap content length defensively.
  const messages = body.messages
    .slice(-12)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  try {
    const result = await generateAnswer({
      messages,
      caseContext: body.caseContext ?? null,
      language: body.language,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[chat] failed:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
