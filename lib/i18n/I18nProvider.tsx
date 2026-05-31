"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDictionary, type Dictionary } from "./dictionaries";
import { DEFAULT_LOCALE, getLocaleMeta, isRtl } from "./locales";

type Vars = Record<string, string | number>;

interface I18nValue {
  locale: string;
  setLocale: (code: string) => void;
  dict: Dictionary;
  /** Translate by dot-path, e.g. t("roadmap.title"). Interpolates {vars}. */
  t: (path: string, vars?: Vars) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "antim.locale";

function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((code: string) => {
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  // Locales beyond the fully-translated five fall back to English content.
  const effectiveLocale = getLocaleMeta(locale).full ? locale : DEFAULT_LOCALE;
  const dict = useMemo(() => getDictionary(effectiveLocale), [effectiveLocale]);

  const t = useCallback(
    (path: string, vars?: Vars) => {
      const value = resolvePath(dict, path);
      if (typeof value === "string") return interpolate(value, vars);
      // Fall back to English source if a key is somehow missing.
      const fallback = resolvePath(getDictionary("en"), path);
      if (typeof fallback === "string") return interpolate(fallback, vars);
      return path;
    },
    [dict],
  );

  const dir = isRtl(locale) ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, dict, t, dir }),
    [locale, setLocale, dict, t, dir],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Convenience hook returning just the translate fn. */
export function useT() {
  return useI18n().t;
}
