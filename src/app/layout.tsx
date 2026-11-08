import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToastProvider } from "@/components/ui/toast";

/** Sans geometrica, la stessa voce di "LIFE" e del payoff nel logo. */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

/** Serif ad alto contrasto per i titoli: richiama il tratto del monogramma AS. */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Senza metadataBase le immagini OG relative (es. /c/[slug]/opengraph-image)
  // restano relative, e WhatsApp/Twitter mostrano il link senza anteprima.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "AS Life — Caffè d'eccellenza",
    template: "%s · AS Life",
  },
  description:
    "Caffè selezionato, tostato con cura. Acquista online, invita chi vuoi e guadagna una provvigione su ogni loro ordine.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${montserrat.variable} ${playfair.variable} h-full`}>
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
