"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { CasesProvider } from "@/lib/store/CasesProvider";
import { ConsentGate } from "@/components/shared/ConsentModal";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <CasesProvider>
            {children}
            <ConsentGate />
          </CasesProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
