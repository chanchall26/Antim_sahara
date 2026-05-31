"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "antim.theme";

interface ThemeValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    let saved: Theme = "dark";
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "light" || s === "dark") saved = s;
    } catch {
      /* ignore */
    }
    setThemeState(saved);
    apply(saved);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    apply(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Inline, render-blocking script string to apply the saved theme before paint (no flash). */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;
