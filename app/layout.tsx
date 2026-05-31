import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Antim Sahara — Compassionate guidance after a loss",
  description:
    "A gentle, AI-guided companion that walks Indian families through everything after a death — registration, bank and insurance claims, succession papers, and tracing unclaimed money. In your language.",
  applicationName: "Antim Sahara",
  keywords: [
    "death certificate India",
    "succession certificate",
    "bank claim deceased",
    "EPFO death claim",
    "unclaimed deposits UDGAM",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#15131c" },
    { media: "(prefers-color-scheme: light)", color: "#fbf6ee" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${lora.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
