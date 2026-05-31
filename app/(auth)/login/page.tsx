"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Mail } from "lucide-react";
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
  const { signInWithEmail, signInWithGoogle, usingFirebase } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = () => router.push("/dashboard");

  const onGoogle = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      go();
    } catch (e) {
      setError((e as AuthError).message ?? "Google sign-in failed.");
      setGoogleBusy(false);
    }
  };

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

            {/* Google sign-in */}
            <button
              onClick={onGoogle}
              disabled={busy || googleBusy}
              className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
            >
              {googleBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
              {t("auth.continueGoogle")}
            </button>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.orEmail")}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-4">
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

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
