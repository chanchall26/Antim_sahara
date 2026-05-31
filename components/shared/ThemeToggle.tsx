"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/lib/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Sun className="h-5 w-5 text-gold" /> : <Moon className="h-5 w-5 text-primary" />}
      </motion.span>
    </button>
  );
}
