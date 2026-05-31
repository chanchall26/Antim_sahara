"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { runTranslate } from "@/lib/agents/client";

const BCP47: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  te: "te-IN",
  ta: "ta-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ur: "ur-IN",
};

/** Reads text aloud in the current language. Translates first (when not English) via the API. */
export function VoiceButton({ text, label }: { text: string; label?: string }) {
  const { locale, t } = useI18n();
  const [state, setState] = useState<"idle" | "loading" | "speaking">("idle");
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const cacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  if (!supported) return null;

  const speak = (toSpeak: string) => {
    const u = new SpeechSynthesisUtterance(toSpeak);
    u.lang = BCP47[locale] ?? "en-IN";
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang === u.lang) ?? voices.find((v) => v.lang.startsWith(locale));
    if (match) u.voice = match;
    u.rate = 0.96;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    setState("speaking");
    window.speechSynthesis.speak(u);
  };

  const onClick = async () => {
    if (state === "speaking") {
      window.speechSynthesis.cancel();
      setState("idle");
      return;
    }
    if (locale === "en") {
      speak(text);
      return;
    }
    // Translate (cached) then speak.
    if (cacheRef.current[text]) {
      speak(cacheRef.current[text]);
      return;
    }
    setState("loading");
    try {
      const { text: translated } = await runTranslate({ text, targetLang: locale });
      cacheRef.current[text] = translated;
      speak(translated);
    } catch {
      speak(text);
    }
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
      aria-label={label ?? t("task.listenGuidance")}
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "speaking" ? (
        <VolumeX className="h-4 w-4 text-accent" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{state === "speaking" ? t("common.stop") : label ?? t("task.listenGuidance")}</span>
    </button>
  );
}
