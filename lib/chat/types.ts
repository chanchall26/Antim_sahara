/**
 * Chat (Saathi) — shared types for the RAG companion.
 * Pure types only, safe to import from both server and client.
 */
import type { TaskCategory } from "@/types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Knowledge topics this answer leaned on (shown as a tiny "based on" line). */
  sources?: ChatSource[];
  at: number;
}

export interface ChatSource {
  id: string;
  title: string;
}

/** Compact, serialisable snapshot of the open case, used to ground answers. */
export interface ChatCaseContext {
  deceasedName?: string;
  religion?: string;
  domicileState?: string;
  hadWill?: boolean;
  relationship?: string;
  /** Doc types the family already holds (so we never re-ask for them). */
  heldDocs?: string[];
  openTasks?: Array<{
    title: string;
    category: TaskCategory;
    status: string;
    institution?: string;
    instrument?: string;
  }>;
}

export interface ChatRequest {
  /** Full rolling thread (we only use the tail for grounding). */
  messages: Array<Pick<ChatMessage, "role" | "content">>;
  caseContext?: ChatCaseContext | null;
  language?: string;
}

export interface ChatResponse {
  reply: string;
  sources: ChatSource[];
  meta: { grounded: boolean; gemini: boolean; demo: boolean };
}
