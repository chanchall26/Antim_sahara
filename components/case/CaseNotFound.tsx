"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/I18nProvider";

export function CaseNotFound() {
  const t = useT();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <FileQuestion className="h-7 w-7" />
      </span>
      <h1 className="font-serif text-2xl font-semibold">This case isn&apos;t here</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It may belong to a different sign-in. Return home to see your cases or start a new one.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>{t("nav.dashboard")}</Button>
      </Link>
    </div>
  );
}
