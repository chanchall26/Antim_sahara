/**
 * Saathi answer engine (SERVER-ONLY — imports the Gemini client).
 *
 * RAG flow:
 *   1. retrieve() pulls the most relevant knowledge chunks (offline, no keys).
 *   2. We assemble grounding = retrieved chunks + the open-case context.
 *   3. If a Gemini key exists we ask it to answer strictly from that grounding;
 *      otherwise (or on any failure) we synthesise a warm answer deterministically.
 *   4. Either way the reply is consoling and points to a next step.
 */
import { DEMO_MODE } from "@/lib/config";
import { geminiEnabled, generateText } from "@/lib/gemini/client";
import { retrieve, fallbackHits, type RetrievalHit } from "./retrieve";
import { consolingOpener, gentleCloser, SAATHI_SYSTEM } from "./console";
import type { ChatRequest, ChatResponse, ChatSource } from "./types";

const MAX_HISTORY = 6;

function lastUserMessage(messages: ChatRequest["messages"]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

function priorUserMessage(messages: ChatRequest["messages"]): string {
  let seenLast = false;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "user") continue;
    if (!seenLast) {
      seenLast = true;
      continue;
    }
    return messages[i].content;
  }
  return "";
}

/** Compact, human-readable grounding string from retrieved knowledge. */
function knowledgeContext(hits: RetrievalHit[]): string {
  return hits
    .map((h) => {
      const c = h.chunk;
      const pts = c.points?.length ? `\n  - ${c.points.join("\n  - ")}` : "";
      const where = c.where ? `\n  Where: ${c.where}` : "";
      return `### ${c.title}\n  ${c.summary}${pts}${where}`;
    })
    .join("\n\n");
}

/** Turn the open-case snapshot into a short grounding block. */
function caseContextBlock(ctx: ChatRequest["caseContext"]): string {
  if (!ctx) return "";
  const bits: string[] = [];
  if (ctx.deceasedName) bits.push(`This case is for ${ctx.deceasedName}.`);
  if (ctx.hadWill != null) bits.push(ctx.hadWill ? "There is a will." : "There is no will.");
  if (ctx.domicileState) bits.push(`Home state: ${ctx.domicileState}.`);
  if (ctx.heldDocs?.length) bits.push(`Documents already on hand: ${ctx.heldDocs.join(", ")}.`);
  if (ctx.openTasks?.length) {
    const tasks = ctx.openTasks
      .slice(0, 6)
      .map((t) => `- ${t.title}${t.instrument ? ` (route: ${t.instrument})` : ""} [${t.status}]`)
      .join("\n");
    bits.push(`Open steps on their roadmap:\n${tasks}`);
  }
  return bits.join("\n");
}

/** A personalised one-liner tying the answer to the family's own roadmap. */
function casePointer(hits: RetrievalHit[], ctx: ChatRequest["caseContext"]): string {
  if (!ctx?.openTasks?.length) return "";
  const cats = new Set(hits.map((h) => h.chunk.category));
  const match = ctx.openTasks.find((tk) => cats.has(tk.category as never));
  if (!match) return "";
  const where = match.institution ? ` at ${match.institution}` : "";
  return `On your roadmap this is the step "${match.title}"${where}.`;
}

/** Deterministic, warm answer used whenever Gemini isn't available. */
function synthesise(hits: RetrievalHit[], ctx: ChatRequest["caseContext"], seed: number): string {
  const top = hits[0]?.chunk;
  const parts: string[] = [consolingOpener(seed)];

  if (top) {
    parts.push(top.summary);
    const points = top.points?.slice(0, 4) ?? [];
    if (points.length) parts.push(points.map((p) => `• ${p}`).join("\n"));
    if (top.where) parts.push(`Where to go: ${top.where}`);

    // A second, closely-related chunk adds breadth without overwhelming.
    const second = hits[1]?.chunk;
    if (second && second.id !== top.id) {
      parts.push(`On ${second.title.toLowerCase()}: ${second.summary}`);
    }
  } else {
    parts.push(
      "I can help with registering the death, bank, provident-fund, insurance and mutual-fund claims, succession papers, and tracing unclaimed money. What's weighing on you most right now?",
    );
  }

  const pointer = casePointer(hits, ctx);
  if (pointer) parts.push(pointer);
  parts.push(gentleCloser(seed));
  return parts.join("\n\n");
}

function toSources(hits: RetrievalHit[]): ChatSource[] {
  const seen = new Set<string>();
  const out: ChatSource[] = [];
  for (const h of hits) {
    if (seen.has(h.chunk.id)) continue;
    seen.add(h.chunk.id);
    out.push({ id: h.chunk.id, title: h.chunk.title });
  }
  return out;
}

export async function generateAnswer(req: ChatRequest): Promise<ChatResponse> {
  const query = lastUserMessage(req.messages);
  const prior = priorUserMessage(req.messages);
  let hits = retrieve(query, 3, prior);
  const grounded = hits.length > 0;
  if (!hits.length) hits = fallbackHits();

  const seed = req.messages.filter((m) => m.role === "user").length;
  const sources = toSources(hits);

  // Try Gemini when a key is configured (even in demo); fall back on any failure so
  // the demo path never depends on a live API succeeding.
  if (geminiEnabled) {
    try {
      const history = req.messages
        .slice(-MAX_HISTORY)
        .map((m) => `${m.role === "user" ? "Family" : "Saathi"}: ${m.content}`)
        .join("\n");
      const langLine =
        req.language && req.language !== "en"
          ? `\nReply in the family's language (locale code: ${req.language}); keep Indian legal/form names in English.`
          : "";
      const prompt = `GUIDANCE (answer only from this):\n${knowledgeContext(hits)}\n\n${
        req.caseContext ? `CASE:\n${caseContextBlock(req.caseContext)}\n\n` : ""
      }CONVERSATION SO FAR:\n${history}\n\nWrite Saathi's next reply.${langLine}`;

      const text = await generateText(prompt, SAATHI_SYSTEM);
      if (text && text.trim()) {
        return { reply: text.trim(), sources, meta: { grounded, gemini: true, demo: DEMO_MODE } };
      }
    } catch {
      /* fall through to deterministic synthesis */
    }
  }

  return {
    reply: synthesise(hits, req.caseContext, seed),
    sources,
    meta: { grounded, gemini: false, demo: DEMO_MODE },
  };
}
