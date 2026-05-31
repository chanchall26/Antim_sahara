"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AdvisorNote,
  CaseDocument,
  CaseTask,
  Deceased,
  EstateCase,
  Heir,
  Asset,
  Relationship,
} from "@/types";
import { makeId } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { firebaseEnabled, db } from "@/lib/firebase/client";
import { normaliseCase, computeSummary } from "./caseLogic";

export interface AuditEntry {
  id: string;
  at: number;
  action: string;
  detail?: string;
}

interface NewCaseInput {
  deceased: Deceased;
  relationshipToDeceased: Relationship;
  heirs?: Heir[];
  assets?: Asset[];
}

interface CasesValue {
  cases: EstateCase[];
  ready: boolean;
  /** "cloud" when syncing to Firestore, "local" for demo/offline. */
  backend: "cloud" | "local";
  getCase: (id: string) => EstateCase | undefined;
  createCase: (input: NewCaseInput) => EstateCase;
  upsertCase: (c: EstateCase) => void;
  applyPlan: (caseId: string, tasks: CaseTask[], notes: AdvisorNote[]) => void;
  updateTask: (caseId: string, taskId: string, patch: Partial<CaseTask>) => void;
  addDocument: (caseId: string, doc: CaseDocument) => void;
  patchDeceased: (caseId: string, patch: Partial<Deceased>) => void;
  deleteCase: (id: string) => void;
  eraseAll: () => void;
  audit: AuditEntry[];
  log: (action: string, detail?: string) => void;
}

const CasesContext = createContext<CasesValue | null>(null);

const keyFor = (uid: string) => `antim.cases.${uid}`;
const auditKeyFor = (uid: string) => `antim.audit.${uid}`;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

/** Firestore docs must be plain + under 1MB: drop undefined and strip large base64 blobs. */
function toFirestore(c: EstateCase): Record<string, unknown> {
  const slim: EstateCase = {
    ...c,
    documents: c.documents.map((d) => ({ ...d, dataUrl: undefined })),
  };
  return JSON.parse(JSON.stringify(slim));
}

export function CasesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const useFirestore = Boolean(firebaseEnabled && db && user && !user.isDemo);

  const [cases, setCasesState] = useState<EstateCase[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [ready, setReady] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  // Ref mirrors `cases` so mutations always read the latest value (no stale closures
  // when several mutations run across awaits, e.g. createCase → applyPlan in the wizard).
  const casesRef = useRef<EstateCase[]>([]);
  const setCases = useCallback((next: EstateCase[]) => {
    casesRef.current = next;
    setCasesState(next);
  }, []);

  // Load / subscribe based on backend.
  useEffect(() => {
    unsubRef.current?.();
    unsubRef.current = null;

    if (!uid) {
      setCases([]);
      setAudit([]);
      setReady(false);
      return;
    }
    setAudit(load<AuditEntry[]>(auditKeyFor(uid), []));

    if (useFirestore && db) {
      setReady(false);
      let active = true;
      import("firebase/firestore").then(({ collection, query, where, onSnapshot }) => {
        if (!active) return;
        const q = query(collection(db!, "cases"), where("ownerUid", "==", uid));
        unsubRef.current = onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map((d) => d.data() as EstateCase);
            list.sort((a, b) => b.createdAt - a.createdAt);
            setCases(list);
            setReady(true);
          },
          (err) => {
            console.error("[firestore] snapshot error:", err);
            setReady(true);
          },
        );
      });
      return () => {
        active = false;
        unsubRef.current?.();
      };
    }

    // Local backend (demo / offline).
    setCases(load<EstateCase[]>(keyFor(uid), []));
    setReady(true);
  }, [uid, useFirestore]);

  // Persist one case (optimistic local state + backend write).
  const writeCase = useCallback(
    (c: EstateCase, nextAll: EstateCase[]) => {
      setCases(nextAll);
      if (useFirestore && db) {
        import("firebase/firestore").then(({ doc, setDoc }) => {
          setDoc(doc(db!, "cases", c.id), toFirestore(c)).catch((e) =>
            console.error("[firestore] write failed:", e),
          );
        });
      } else if (uid) {
        save(keyFor(uid), nextAll);
      }
    },
    [useFirestore, uid],
  );

  const removeCase = useCallback(
    (id: string, nextAll: EstateCase[]) => {
      setCases(nextAll);
      if (useFirestore && db) {
        import("firebase/firestore").then(({ doc, deleteDoc }) => {
          deleteDoc(doc(db!, "cases", id)).catch((e) => console.error("[firestore] delete failed:", e));
        });
      } else if (uid) {
        save(keyFor(uid), nextAll);
      }
    },
    [useFirestore, uid],
  );

  const log = useCallback(
    (action: string, detail?: string) => {
      if (!uid) return;
      setAudit((prev) => {
        const next = [{ id: makeId("a"), at: Date.now(), action, detail }, ...prev].slice(0, 200);
        save(auditKeyFor(uid), next);
        return next;
      });
    },
    [uid],
  );

  const getCase = useCallback((id: string) => cases.find((c) => c.id === id), [cases]);

  const createCase = useCallback(
    (input: NewCaseInput): EstateCase => {
      const now = Date.now();
      const base: EstateCase = {
        id: makeId("case"),
        ownerUid: uid ?? "anon",
        deceased: input.deceased,
        relationshipToDeceased: input.relationshipToDeceased,
        status: "active",
        createdAt: now,
        updatedAt: now,
        heirs: input.heirs ?? [],
        assets: input.assets ?? [],
        tasks: [],
        documents: [],
        advisorNotes: [],
        summary: computeSummary([]),
      };
      writeCase(base, [base, ...casesRef.current]);
      log("case.create", input.deceased.name);
      return base;
    },
    [writeCase, uid, log],
  );

  const upsertCase = useCallback(
    (c: EstateCase) => {
      const normalised = normaliseCase(c);
      const current = casesRef.current;
      const exists = current.some((x) => x.id === c.id);
      writeCase(
        normalised,
        exists ? current.map((x) => (x.id === c.id ? normalised : x)) : [normalised, ...current],
      );
    },
    [writeCase],
  );

  const applyPlan = useCallback(
    (caseId: string, tasks: CaseTask[], notes: AdvisorNote[]) => {
      const target = casesRef.current.find((c) => c.id === caseId);
      if (!target) return;
      const updated = normaliseCase({ ...target, tasks, advisorNotes: notes });
      writeCase(updated, casesRef.current.map((c) => (c.id === caseId ? updated : c)));
      log("plan.generated", `${tasks.length} tasks`);
    },
    [writeCase, log],
  );

  const updateTask = useCallback(
    (caseId: string, taskId: string, patch: Partial<CaseTask>) => {
      const target = casesRef.current.find((c) => c.id === caseId);
      if (!target) return;
      const tasks = target.tasks.map((tk) => (tk.id === taskId ? { ...tk, ...patch } : tk));
      const updated = normaliseCase({ ...target, tasks });
      writeCase(updated, casesRef.current.map((c) => (c.id === caseId ? updated : c)));
      if (patch.status) log("task.status", `${taskId} → ${patch.status}`);
    },
    [writeCase, log],
  );

  const addDocument = useCallback(
    (caseId: string, doc: CaseDocument) => {
      const target = casesRef.current.find((c) => c.id === caseId);
      if (!target) return;
      const updated = normaliseCase({ ...target, documents: [doc, ...target.documents] });
      writeCase(updated, casesRef.current.map((c) => (c.id === caseId ? updated : c)));
      log("document.add", doc.docType);
    },
    [writeCase, log],
  );

  const patchDeceased = useCallback(
    (caseId: string, patch: Partial<Deceased>) => {
      const target = casesRef.current.find((c) => c.id === caseId);
      if (!target) return;
      const updated = normaliseCase({ ...target, deceased: { ...target.deceased, ...patch } });
      writeCase(updated, casesRef.current.map((c) => (c.id === caseId ? updated : c)));
    },
    [writeCase],
  );

  const deleteCase = useCallback(
    (id: string) => {
      removeCase(id, casesRef.current.filter((c) => c.id !== id));
      log("case.delete", id);
    },
    [removeCase, log],
  );

  const eraseAll = useCallback(() => {
    if (useFirestore && db) {
      import("firebase/firestore").then(({ doc, deleteDoc }) => {
        casesRef.current.forEach((c) => deleteDoc(doc(db!, "cases", c.id)).catch(() => {}));
      });
    }
    if (uid) {
      save(keyFor(uid), []);
      save(auditKeyFor(uid), []);
    }
    setCases([]);
    setAudit([]);
  }, [useFirestore, uid, setCases]);

  const value = useMemo<CasesValue>(
    () => ({
      cases,
      ready,
      backend: useFirestore ? "cloud" : "local",
      getCase,
      createCase,
      upsertCase,
      applyPlan,
      updateTask,
      addDocument,
      patchDeceased,
      deleteCase,
      eraseAll,
      audit,
      log,
    }),
    [
      cases,
      ready,
      useFirestore,
      getCase,
      createCase,
      upsertCase,
      applyPlan,
      updateTask,
      addDocument,
      patchDeceased,
      deleteCase,
      eraseAll,
      audit,
      log,
    ],
  );

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases(): CasesValue {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within CasesProvider");
  return ctx;
}
