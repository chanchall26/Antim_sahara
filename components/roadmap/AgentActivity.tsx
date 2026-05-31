"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, FileSearch, Loader2, Scale, Sparkles, Route } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useT } from "@/lib/i18n/I18nProvider";

interface AgentStep {
  key: string;
  icon: React.ReactNode;
  labelKey: string;
}

function steps(hasCert: boolean): AgentStep[] {
  const base: AgentStep[] = [
    { key: "advise", icon: <Scale className="h-4 w-4" />, labelKey: "roadmap.agentAdvising" },
    { key: "plan", icon: <Route className="h-4 w-4" />, labelKey: "roadmap.agentPlanning" },
  ];
  if (hasCert)
    base.unshift({ key: "parse", icon: <FileSearch className="h-4 w-4" />, labelKey: "roadmap.agentParsing" });
  return base;
}

/** Full-screen "agents are building your roadmap" moment (after intake). */
export function AgentBuilding({ hasCert }: { hasCert: boolean }) {
  const t = useT();
  const list = steps(hasCert);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => Math.min(a + 1, list.length)), 800);
    return () => clearInterval(id);
  }, [list.length]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <Logo withWord={false} className="scale-[1.8]" />
      </motion.div>
      <h2 className="mt-8 font-serif text-2xl font-semibold">{t("onboarding.buildingTitle")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.buildingSub")}</p>

      <div className="mt-8 w-full max-w-sm space-y-2.5">
        {list.map((s, i) => {
          const done = i < active;
          const running = i === active;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                done
                  ? "border-success/30 bg-success-soft"
                  : running
                    ? "border-primary/40 bg-primary-soft"
                    : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  done ? "bg-success text-white" : running ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : running ? <Loader2 className="h-4 w-4 animate-spin" /> : s.icon}
              </span>
              <span className="text-sm font-medium">{t(s.labelKey)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Subtle panel shown on the roadmap showing how the plan was made (the agentic story). */
export function AgentActivityPanel({ parallelTracks }: { parallelTracks?: string[] }) {
  const t = useT();
  const items = [
    { icon: <FileSearch className="h-4 w-4" />, label: t("roadmap.agentParsing") },
    { icon: <Scale className="h-4 w-4" />, label: t("roadmap.agentAdvising") },
    { icon: <Route className="h-4 w-4" />, label: t("roadmap.agentPlanning") },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-secondary" />
        <h3 className="text-sm font-semibold">{t("roadmap.agentTitle")}</h3>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t("roadmap.agentSub")}</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft text-success">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-foreground/70">{it.icon}</span>
              {it.label}
            </span>
          </li>
        ))}
      </ul>

      {parallelTracks && parallelTracks.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("roadmap.tracksTitle")}</p>
          <div className="flex flex-wrap gap-1.5">
            {parallelTracks.map((track) => (
              <motion.span
                key={track}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-2.5 py-1 text-[11px] font-medium text-secondary"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {track}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
