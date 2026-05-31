"use client";

/**
 * Voice helpers built on the browser's native Web Speech API (no dependencies):
 *  - speakText()  → text-to-speech in the selected language (SpeechSynthesis)
 *  - useSpeechRecognition() → speech-to-text in the selected language (SpeechRecognition)
 * Both map our locale codes to BCP-47 tags so they speak/listen in the right Indic language.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export const BCP47: Record<string, string> = {
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
  as: "as-IN",
  or: "or-IN",
};

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let warmed = false;
/** Some browsers populate voices asynchronously; nudge them to load. */
function ensureVoices() {
  if (warmed || !ttsSupported()) return;
  warmed = true;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

export function cancelSpeak() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/** Speak `text` aloud in `locale`'s voice. Returns a stop() function. */
export function speakText(
  text: string,
  locale: string,
  opts?: { onStart?: () => void; onEnd?: () => void },
): () => void {
  if (!ttsSupported() || !text.trim()) {
    opts?.onEnd?.();
    return () => {};
  }
  ensureVoices();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = BCP47[locale] ?? "en-IN";
  u.lang = lang;
  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith(locale)) ??
    voices.find((v) => v.lang?.startsWith(lang.split("-")[0]));
  if (match) u.voice = match;
  u.rate = 0.97;
  u.pitch = 1;
  u.onstart = () => opts?.onStart?.();
  u.onend = () => opts?.onEnd?.();
  u.onerror = () => opts?.onEnd?.();
  window.speechSynthesis.speak(u);
  return () => window.speechSynthesis.cancel();
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

/** Hook for hands-free voice input in the current locale. */
export function useSpeechRecognition(locale: string) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
    return () => recRef.current?.stop();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(
    (onInterim: (text: string) => void, onFinal: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      // Don't talk over ourselves.
      cancelSpeak();
      const rec = new Ctor();
      rec.lang = BCP47[locale] ?? "en-IN";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        let txt = "";
        for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
        onInterim(txt);
        const last = e.results[e.results.length - 1];
        if (last?.isFinal) onFinal(txt.trim());
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
      setListening(true);
      try {
        rec.start();
      } catch {
        setListening(false);
      }
    },
    [locale],
  );

  return { supported, listening, start, stop };
}
