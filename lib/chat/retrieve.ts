/**
 * Lexical retriever for Saathi (the retrieval step of RAG).
 *
 * Deliberately dependency-free and offline: it scores knowledge chunks by weighted
 * token overlap with a small synonym/Hinglish expansion. This keeps the demo working
 * with ZERO API keys. When a Gemini key is present, these same chunks become the
 * grounding context for generation (see engine.ts).
 */
import { KNOWLEDGE, type KnowledgeChunk } from "./knowledge";

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "do", "does", "did", "to", "of", "for",
  "in", "on", "at", "and", "or", "but", "if", "my", "me", "we", "our", "us", "you", "your",
  "i", "it", "this", "that", "with", "how", "what", "where", "when", "who", "can", "should",
  "would", "will", "have", "has", "need", "want", "about", "from", "they", "them", "their",
  "he", "she", "his", "her", "please", "tell", "know", "get", "got", "any", "some",
]);

/** Map a token to extra tokens so everyday / Hinglish words hit the right chunk. */
const SYNONYMS: Record<string, string[]> = {
  money: ["bank", "deposit", "paisa", "funds"],
  paisa: ["money", "bank", "funds"],
  cash: ["bank", "money"],
  sbi: ["bank"],
  hdfc: ["bank", "mutual"],
  account: ["bank"],
  khata: ["bank", "account"],
  pf: ["epf", "epfo", "provident"],
  provident: ["epf", "epfo"],
  lic: ["insurance", "policy"],
  bima: ["insurance"],
  policy: ["insurance"],
  shares: ["demat", "mutual", "securities"],
  stocks: ["demat", "shares", "securities"],
  equity: ["demat", "shares"],
  mf: ["mutual", "fund"],
  will: ["probate", "vasiyat", "executor"],
  vasiyat: ["will", "probate"],
  inherit: ["heir", "share", "succession"],
  inheritance: ["heir", "share", "succession"],
  divide: ["heir", "share"],
  hissa: ["heir", "share"],
  papers: ["document", "documents"],
  kagaz: ["document", "documents"],
  certificate: ["certificate", "death", "succession", "heir"],
  register: ["registration"],
  dead: ["death"],
  died: ["death"],
  passed: ["death"],
  mrityu: ["death", "registration"],
  owed: ["unclaimed"],
  forgotten: ["unclaimed"],
  lost: ["unclaimed", "lost"],
  cope: ["grief", "sad"],
  coping: ["grief", "sad"],
  overwhelmed: ["grief", "start"],
  alone: ["grief"],
  first: ["start", "begin", "first"],
  begin: ["start", "first"],
  shuru: ["start", "first"],
  pehla: ["start", "first"],
};

function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  const expanded = new Set<string>(raw);
  for (const w of raw) {
    for (const syn of SYNONYMS[w] ?? []) expanded.add(syn);
  }
  return [...expanded];
}

export interface RetrievalHit {
  chunk: KnowledgeChunk;
  score: number;
}

/**
 * Return the top-k knowledge chunks for a query. `recentContext` (the previous user
 * turn) is folded in at a low weight so short follow-ups ("what documents?") still land.
 */
export function retrieve(query: string, k = 3, recentContext = ""): RetrievalHit[] {
  const qTokens = tokenize(query);
  const ctxTokens = tokenize(recentContext);
  if (qTokens.length === 0 && ctxTokens.length === 0) return [];

  const hits: RetrievalHit[] = KNOWLEDGE.map((chunk) => {
    const tagSet = new Set(chunk.tags);
    const titleTokens = new Set(tokenize(chunk.title));
    const bodyTokens = new Set(tokenize(`${chunk.summary} ${(chunk.points ?? []).join(" ")}`));

    let score = 0;
    for (const tok of qTokens) {
      if (tagSet.has(tok)) score += 3;
      if (titleTokens.has(tok)) score += 2;
      if (bodyTokens.has(tok)) score += 1;
    }
    for (const tok of ctxTokens) {
      if (tagSet.has(tok)) score += 0.75; // prior turn nudges, never dominates
    }
    return { chunk, score };
  }).filter((h) => h.score > 0);

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, k);
}

/** A sensible default set when a question doesn't match anything specific. */
export function fallbackHits(): RetrievalHit[] {
  return KNOWLEDGE.filter((c) => c.id === "first-steps" || c.id === "documents").map((chunk) => ({
    chunk,
    score: 0,
  }));
}
