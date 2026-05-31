/**
 * Browser-side chat helpers: the API call + persistent thread memory.
 * Persisting the thread in localStorage is what keeps Saathi from "losing memory"
 * when the family navigates between pages or reloads.
 *
 * Must stay free of server-only imports (no Gemini, no engine).
 */
import type { ChatCaseContext, ChatMessage, ChatResponse } from "./types";
import type { EstateCase } from "@/types";

export async function runChat(input: {
  messages: Array<Pick<ChatMessage, "role" | "content">>;
  caseContext?: ChatCaseContext | null;
  language?: string;
}): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`/api/chat → ${res.status}`);
  return (await res.json()) as ChatResponse;
}

const threadKey = (uid: string) => `antim.chat.${uid}`;

export function loadThread(uid: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(threadKey(uid));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveThread(uid: string, messages: ChatMessage[]) {
  try {
    // Keep the stored thread bounded so it never bloats localStorage.
    localStorage.setItem(threadKey(uid), JSON.stringify(messages.slice(-40)));
  } catch {
    /* ignore quota */
  }
}

export function clearThread(uid: string) {
  try {
    localStorage.removeItem(threadKey(uid));
  } catch {
    /* ignore */
  }
}

/** Build the compact, serialisable case snapshot Saathi uses for grounding. */
export function buildCaseContext(c: EstateCase): ChatCaseContext {
  const instrumentFor = (assetId?: string) =>
    assetId ? c.advisorNotes?.find((n) => n.assetId === assetId)?.instrument : undefined;
  return {
    deceasedName: c.deceased.name,
    religion: c.deceased.religion,
    domicileState: c.deceased.domicileState,
    hadWill: c.deceased.hadWill,
    relationship: c.relationshipToDeceased,
    heldDocs: Array.from(new Set(c.documents.map((d) => d.docType))),
    openTasks: c.tasks
      .filter((t) => t.status !== "done")
      .slice(0, 8)
      .map((t) => ({
        title: t.title,
        category: t.category,
        status: t.status,
        institution: t.institution,
        instrument: instrumentFor(t.assetId),
      })),
  };
}
