/** Thin client wrappers around the agent API routes. */
import type { AdvisorNote, Asset, CaseTask, Deceased } from "@/types";
import type { DeathCertParsed } from "@/lib/gemini/schemas";
import type { TemplateVars } from "@/lib/templates/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

export function runOrchestrate(input: {
  deceased: Deceased;
  assets: Asset[];
  relationshipToDeceased: string;
  language?: string;
}) {
  return postJson<{ tasks: CaseTask[]; notes: AdvisorNote[]; meta: Record<string, unknown> }>(
    "/api/agents/orchestrate",
    input,
  );
}

export function runParseDocument(input: { data?: string; mimeType?: string; docType?: string }) {
  return postJson<{ extracted: DeathCertParsed; source: string }>(
    "/api/agents/parse-document",
    input,
  );
}

export function runGenerateDoc(input: { templateKey: string; vars: TemplateVars }) {
  return postJson<{
    fileName: string;
    docType: string;
    title: string;
    mimeType: string;
    dataUrl: string;
  }>("/api/agents/generate-doc", input);
}

export interface UnclaimedItem {
  key: string;
  title: string;
  url: string;
  why: string;
  steps: string[];
}

export function runUnclaimed(input: {
  deceasedName?: string;
  pan?: string;
  hasShares?: boolean;
  hasInsurance?: boolean;
  hasBank?: boolean;
}) {
  return postJson<{ packet: UnclaimedItem[] }>("/api/unclaimed", input);
}

export function runTranslate(input: { text: string; targetLang: string }) {
  return postJson<{ text: string; provider: string }>("/api/bhashini", input);
}

/** Read a File into base64 (no data: prefix) for multimodal upload. */
export function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve({ data: result.slice(comma + 1), mimeType: file.type || "application/octet-stream" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
