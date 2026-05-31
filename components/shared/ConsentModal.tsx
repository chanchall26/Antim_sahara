"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, Lock, ScrollText, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const consentKey = (uid: string) => `antim.consent.${uid}`;

/** One-time consent modal shown on first login. */
export function ConsentGate() {
  const { user, signOut } = useAuth();
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setOpen(false);
      return;
    }
    try {
      const consented = localStorage.getItem(consentKey(user.uid));
      setOpen(!consented);
    } catch {
      setOpen(true);
    }
  }, [user]);

  if (!user) return null;

  const accept = () => {
    try {
      localStorage.setItem(consentKey(user.uid), String(Date.now()));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} hideClose labelledBy="consent-title" className="max-w-xl">
      <div className="flex flex-col items-center text-center">
        <Logo withWord={false} className="mb-3 scale-125" />
        <h2 id="consent-title" className="font-serif text-2xl font-semibold">
          {t("disclaimer.consentTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("disclaimer.consentBody")}
        </p>
      </div>

      <ul className="mt-5 space-y-3">
        <ConsentPoint icon={<ScrollText className="h-4 w-4" />} text={t("disclaimer.consentPoint1")} />
        <ConsentPoint icon={<Lock className="h-4 w-4" />} text={t("disclaimer.consentPoint2")} />
        <ConsentPoint icon={<ShieldCheck className="h-4 w-4" />} text={t("disclaimer.consentPoint3")} />
      </ul>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
        <Button size="lg" variant="gradient" className="flex-1" onClick={accept}>
          <HeartHandshake className="h-5 w-5" />
          {t("disclaimer.consentAccept")}
        </Button>
        <Button size="lg" variant="ghost" className="flex-1" onClick={signOut}>
          {t("disclaimer.consentDecline")}
        </Button>
      </div>
    </Dialog>
  );
}

function ConsentPoint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="text-sm leading-relaxed text-foreground/85">{text}</span>
    </li>
  );
}
