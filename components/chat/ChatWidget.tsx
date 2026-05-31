"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  HeartHandshake,
  Loader2,
  MessageCircleHeart,
  Mic,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCases } from "@/lib/store/CasesProvider";
import { useI18n, useT } from "@/lib/i18n/I18nProvider";
import { makeId } from "@/lib/utils";
import { cancelSpeak, speakText, ttsSupported, useSpeechRecognition } from "@/lib/speech";
import {
  buildCaseContext,
  clearThread,
  loadThread,
  runChat,
  saveThread,
} from "@/lib/chat/client";
import type { ChatMessage } from "@/lib/chat/types";

/** Suggested openers — labels are translated, queries stay English to match the KB. */
interface Suggestion {
  key: string;
  query: string;
}
const GENERAL_SUGGESTIONS: Suggestion[] = [
  { key: "chat.sRegister", query: "How do I register the death and get the certificate?" },
  { key: "chat.sDocs", query: "Which documents will I need?" },
  { key: "chat.sSuccession", query: "What is a Succession Certificate and when do I need one?" },
  { key: "chat.sUnclaimed", query: "How do I trace unclaimed money owed to the family?" },
];
const CASE_SUGGESTIONS: Suggestion[] = [
  { key: "chat.sNext", query: "What should I do first?" },
  { key: "chat.sDocs", query: "Which documents will I need for these claims?" },
  { key: "chat.sBank", query: "How do I claim the bank account?" },
  { key: "chat.sHeir", query: "Who inherits, and how is it divided?" },
];

const VOICE_PREF_KEY = "antim.chat.voice";

export function ChatWidget() {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const { getCase } = useCases();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice: output (speak answers) + which message is currently speaking.
  const [voiceOut, setVoiceOut] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const canTTS = ttsSupported();
  const stt = useSpeechRecognition(locale);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Which case (if any) is being viewed, so answers can be grounded in it.
  const caseId = useMemo(() => pathname?.match(/\/case\/([^/]+)/)?.[1], [pathname]);
  const activeCase = caseId ? getCase(caseId) : undefined;
  const caseContext = useMemo(
    () => (activeCase ? buildCaseContext(activeCase) : null),
    [activeCase],
  );
  const suggestions = activeCase ? CASE_SUGGESTIONS : GENERAL_SUGGESTIONS;

  // Load the persisted thread + voice preference per user (Saathi keeps its memory).
  useEffect(() => {
    if (user?.uid) setMessages(loadThread(user.uid));
    try {
      setVoiceOut(localStorage.getItem(VOICE_PREF_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, [user?.uid]);

  // Persist on every change.
  useEffect(() => {
    if (user?.uid) saveThread(user.uid, messages);
  }, [user?.uid, messages]);

  // Keep the view pinned to the latest message.
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  // Focus the field on open; close on Escape; stop any speech when closing.
  useEffect(() => {
    if (!open) {
      cancelSpeak();
      setSpeakingId(null);
      return;
    }
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const toggleVoiceOut = () => {
    setVoiceOut((v) => {
      const nv = !v;
      try {
        localStorage.setItem(VOICE_PREF_KEY, nv ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (!nv) {
        cancelSpeak();
        setSpeakingId(null);
      }
      return nv;
    });
  };

  const speakMessage = (m: ChatMessage) => {
    if (speakingId === m.id) {
      cancelSpeak();
      setSpeakingId(null);
      return;
    }
    speakText(m.content, locale, {
      onStart: () => setSpeakingId(m.id),
      onEnd: () => setSpeakingId(null),
    });
  };

  const send = async (raw: string, viaVoice = false) => {
    const text = raw.trim();
    if (!text || loading) return;
    cancelSpeak();
    setInput("");
    const userMsg: ChatMessage = { id: makeId("m"), role: "user", content: text, at: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const res = await runChat({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        caseContext,
        language: locale,
      });
      const aid = makeId("m");
      setMessages((prev) => [
        ...prev,
        { id: aid, role: "assistant", content: res.reply, sources: res.sources, at: Date.now() },
      ]);
      // Speak the reply when voice output is on, or when the question was asked by voice.
      if ((voiceOut || viaVoice) && canTTS) {
        speakText(res.reply, locale, {
          onStart: () => setSpeakingId(aid),
          onEnd: () => setSpeakingId(null),
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: makeId("m"), role: "assistant", content: t("chat.error"), at: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onMic = () => {
    if (stt.listening) {
      stt.stop();
      return;
    }
    setInput("");
    stt.start(
      (interim) => setInput(interim),
      (final) => {
        setInput("");
        if (final) send(final, true);
      },
    );
  };

  const onClear = () => {
    if (user?.uid) clearThread(user.uid);
    cancelSpeak();
    setSpeakingId(null);
    setMessages([]);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            onClick={() => setOpen(true)}
            aria-label={t("chat.fab")}
            className="group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-[linear-gradient(125deg,#6a4ff0_0%,#c0497f_60%,#cf6a2e_100%)] py-3 pl-3 pr-4 text-white shadow-[0_12px_36px_-8px_rgba(124,92,240,0.6)] transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
              <MessageCircleHeart className="relative h-6 w-6" />
            </span>
            <span className="text-sm font-semibold">{t("chat.fabLabel")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            role="dialog"
            aria-label={t("chat.title")}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[78vh] max-h-[640px] flex-col overflow-hidden border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:w-[400px] sm:rounded-3xl rounded-t-3xl"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-border bg-[linear-gradient(125deg,#6a4ff0_0%,#c0497f_60%,#cf6a2e_100%)] px-4 py-3.5 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-base font-semibold leading-tight">{t("chat.title")}</p>
                <p className="truncate text-xs text-white/80">
                  {activeCase ? t("chat.subtitleCase", { name: activeCase.deceased.name }) : t("chat.subtitle")}
                </p>
              </div>
              {canTTS && (
                <button
                  onClick={toggleVoiceOut}
                  aria-pressed={voiceOut}
                  aria-label={voiceOut ? "Turn off spoken answers" : "Read answers aloud"}
                  title={voiceOut ? "Voice answers: on" : "Voice answers: off"}
                  className={`rounded-lg p-2 transition-colors hover:bg-white/15 ${
                    voiceOut ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {voiceOut ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={onClear}
                  aria-label={t("chat.clear")}
                  className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-warm-grain px-4 py-4">
              {/* Greeting + suggestions (empty state) */}
              {messages.length === 0 && (
                <div className="space-y-4">
                  <Bubble role="assistant">
                    {activeCase
                      ? t("chat.greetingCase", { name: activeCase.deceased.name })
                      : t("chat.greeting")}
                  </Bubble>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => send(s.query)}
                        className="rounded-full border border-primary/30 bg-primary-soft/60 px-3 py-1.5 text-left text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                      >
                        {t(s.key)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <Bubble
                  key={m.id}
                  role={m.role}
                  sources={m.sources}
                  onSpeak={m.role === "assistant" && canTTS ? () => speakMessage(m) : undefined}
                  speaking={speakingId === m.id}
                >
                  {m.content}
                </Bubble>
              ))}

              {loading && (
                <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {t("chat.thinking")}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-card px-3 pb-3 pt-2.5">
              {stt.listening && (
                <div className="mb-2 flex items-center justify-center gap-2 text-xs font-medium text-accent">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-accent" />
                  {t("voice.listening")}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={stt.listening ? t("voice.listening") : t("chat.placeholder")}
                  aria-label={t("chat.placeholder")}
                  className="h-11 flex-1 rounded-2xl"
                  disabled={loading}
                />
                {stt.supported && (
                  <button
                    type="button"
                    onClick={onMic}
                    aria-label={t("voice.speak")}
                    aria-pressed={stt.listening}
                    title={t("voice.speak")}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-md transition-all active:scale-95 ${
                      stt.listening
                        ? "animate-pulse bg-accent text-accent-foreground"
                        : "border border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {stt.listening ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label={t("chat.send")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10.5px] leading-tight text-muted-foreground">
                <Sparkles className="h-3 w-3 shrink-0" />
                {t("chat.disclaimer")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({
  role,
  sources,
  children,
  onSpeak,
  speaking,
}: {
  role: ChatMessage["role"];
  sources?: ChatMessage["sources"];
  children: React.ReactNode;
  onSpeak?: () => void;
  speaking?: boolean;
}) {
  const t = useT();
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group/bubble flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={[
          "relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-card text-foreground/90",
        ].join(" ")}
      >
        {children}
        {!isUser && sources && sources.length > 0 && (
          <p className="mt-2 border-t border-border/70 pt-1.5 text-[10.5px] text-muted-foreground">
            {t("chat.basedOn")}: {sources.map((s) => s.title).join(" · ")}
          </p>
        )}
        {onSpeak && (
          <button
            onClick={onSpeak}
            aria-label={speaking ? t("common.stop") : t("common.listen")}
            title={speaking ? t("common.stop") : t("common.listen")}
            className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium transition-colors ${
              speaking ? "bg-accent-soft text-accent" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {speaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            {speaking ? t("common.stop") : t("common.listen")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
