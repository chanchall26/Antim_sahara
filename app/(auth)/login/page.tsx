"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Mail, Sparkles } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useAuth, type AuthError } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { signInDemo, signInWithEmail, usingFirebase } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = () => router.push("/dashboard");

  const onEmail = async () => {
    setError(null);
    if (!email.includes("@")) {
      setError(t("auth.email") + " ?");
      return;
    }
    if (password.length < 6) {
      setError(t("auth.passwordPlaceholder"));
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password, name.trim());
      go();
    } catch (e) {
      setError((e as AuthError).message ?? "Something went wrong.");
      setBusy(false);
    }
  };

  const onDemo = () => {
    signInDemo(name.trim() || "Friend");
    go();
  };

  return (
    <div className="flex min-h-screen flex-col bg-warm-grain">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle compact />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
            <h1 className="font-serif text-2xl font-semibold">{t("auth.loginTitle")}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t("auth.loginSubtitle")}
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.nameLabel")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.namePlaceholder")}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    autoComplete="current-password"
                    className="pr-12"
                    onKeyDown={(e) => e.key === "Enter" && onEmail()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{t("auth.newHere")}</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button size="lg" variant="gradient" className="w-full" onClick={onEmail} disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                {t("auth.signInCreate")}
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button size="lg" variant="secondary" className="w-full" onClick={onDemo} disabled={busy}>
              <Sparkles className="h-5 w-5" />
              {t("auth.continueDemo")}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t("auth.demoNote")}</p>
          </div>

          {usingFirebase && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              🔒 Secured by Firebase Authentication
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
