import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/** Serif display per i titoli: dà voce al brand, il corpo resta Geist per leggibilità. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  // Senza metadataBase le immagini OG relative (es. /c/[slug]/opengraph-image)
  // restano relative, e WhatsApp/Twitter mostrano il link senza anteprima.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Caffè Network — Caffè d'eccellenza",
    template: "%s · Caffè Network",
  },
  description:
    "Caffè selezionato, tostato con cura. Acquista online, invita chi vuoi e guadagna una provvigione su ogni loro ordine.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${geistSans.variable} ${fraunces.variable} h-full`}>
      <head>
        {/* Senza JS l'IntersectionObserver non gira: i .reveal resterebbero invisibili. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col bg-cream text-coffee-900">
        <ToastProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
