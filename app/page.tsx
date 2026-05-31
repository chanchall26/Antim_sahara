"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  HeartHandshake,
  MessageCircleHeart,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { DisclaimerFooter } from "@/components/shared/Disclaimer";
import { Ornament } from "@/components/shared/Ornament";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/I18nProvider";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  const t = useT();
  const [line1, line2] = t("landing.heroTitle").split("\n");

  return (
    <div className="flex min-h-screen flex-col bg-warm-grain">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle compact />
          <Link href="/login" className="hidden sm:block">
            <Button variant="gradient" size="sm">
              {t("common.begin")}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.div
              initial="hidden"
              animate="show"
              custom={0}
              variants={fadeUp}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-secondary" />
              {t("landing.trustLine")}
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="show"
              custom={1}
              variants={fadeUp}
              className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              {line1}
              <br />
              <span className="text-gradient">{line2}</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="show"
              custom={2}
              variants={fadeUp}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              {t("landing.heroSubtitle")}
            </motion.p>

            <motion.div
              initial="hidden"
              animate="show"
              custom={3}
              variants={fadeUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/login">
                <Button size="lg" variant="gradient" className="w-full sm:w-auto">
                  <HeartHandshake className="h-5 w-5" />
                  {t("landing.heroCta")}
                </Button>
              </Link>
              <Link href="#how">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t("landing.heroSecondary")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Calm illustration card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="float-soft card-craft relative overflow-hidden rounded-[2rem] bg-warm-hero p-7 shadow-2xl backdrop-blur">
              {/* floating embers from the diya */}
              <span className="ember left-[calc(50%-18px)] top-16 h-1.5 w-1.5" style={{ animationDelay: "0s" }} />
              <span className="ember left-[50%] top-14 h-1 w-1" style={{ animationDelay: "1.2s" }} />
              <span className="ember left-[calc(50%+16px)] top-16 h-1.5 w-1.5" style={{ animationDelay: "2.4s" }} />
              <span className="ember left-[calc(50%+4px)] top-12 h-1 w-1" style={{ animationDelay: "3.3s" }} />
              <Logo withWord={false} className="scale-[2.2] py-6" />
              <div className="mt-6 space-y-3">
                {[
                  { icon: <MessageCircleHeart className="h-4 w-4" />, label: t("landing.step1Title") },
                  { icon: <ClipboardList className="h-4 w-4" />, label: t("landing.step2Title") },
                  { icon: <FileText className="h-4 w-4" />, label: t("landing.step3Title") },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      {row.icon}
                    </span>
                    <span className="text-sm font-medium text-foreground">{row.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { n: "1", icon: <MessageCircleHeart className="h-6 w-6" />, title: t("landing.step1Title"), body: t("landing.step1Body"), tone: "bg-primary", ring: "hover:border-primary/40" },
            { n: "2", icon: <ClipboardList className="h-6 w-6" />, title: t("landing.step2Title"), body: t("landing.step2Body"), tone: "bg-secondary", ring: "hover:border-secondary/40" },
            { n: "3", icon: <FileText className="h-6 w-6" />, title: t("landing.step3Title"), body: t("landing.step3Body"), tone: "bg-accent", ring: "hover:border-accent/40" },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl border-2 border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${step.ring}`}
            >
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md ${step.tone}`}>
                {step.icon}
              </div>
              <h3 className="font-serif text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The cause / stats */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold leading-tight">
              {t("landing.causeTitle")}
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              {t("landing.causeBody")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat value={t("landing.statUnclaimedValue")} label={t("landing.statUnclaimedLabel")} tone="accent" />
            <Stat value={t("landing.statWillValue")} label={t("landing.statWillLabel")} tone="secondary" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6">
        <Ornament className="mb-8" />
        <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
          {t("landing.finalCta")}
        </h2>
        <Link href="/login" className="mt-8 inline-block">
          <Button size="lg" variant="gradient">
            <HeartHandshake className="h-5 w-5" />
            {t("landing.heroCta")}
          </Button>
        </Link>
      </section>

      <DisclaimerFooter />
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: "accent" | "secondary" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className={`font-serif text-3xl font-bold ${tone === "accent" ? "text-accent" : "text-secondary"}`}>
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{label}</p>
    </div>
  );
}
