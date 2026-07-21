import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MiniSiteTheme, MiniSiteTagline } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { initials, taglineText, themeTokens } from "@/lib/mini-site";

type Props = {
  displayName: string;
  theme: MiniSiteTheme;
  tagline: MiniSiteTagline;
};

/**
 * Hero del mini-sito. Il tema passa da CSS custom properties impostate una sola
 * volta qui: c'è un unico percorso JSX per tutte e tre le atmosfere, quindi è
 * strutturalmente impossibile che una di esse diverga per spaziature o tipografia.
 */
export function MiniSiteHero({ displayName, theme, tagline }: Props) {
  const t = themeTokens(theme);
  const phrase = taglineText(tagline);

  return (
    <section
      style={
        {
          "--ms-bg": t.bg,
          "--ms-fg": t.fg,
          "--ms-muted": t.muted,
          "--ms-accent": t.accent,
          "--ms-on-accent": t.onAccent,
          "--ms-hairline": t.hairline,
          "--ms-glow": t.glow,
          "--grain-opacity": String(t.grain),
        } as React.CSSProperties
      }
      className="relative isolate overflow-hidden bg-(--ms-bg) text-(--ms-fg)"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,var(--ms-glow),transparent_65%)]"
      />
      <div className="grain absolute inset-0 -z-10" aria-hidden />

      <div className="container-page py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-7 flex justify-center">
            <span className="flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-(--ms-accent) font-heading text-2xl font-bold text-(--ms-on-accent) shadow-(--shadow-accent)">
              {initials(displayName)}
            </span>
          </div>

          <p className="animate-fade-up text-sm font-medium uppercase tracking-wider text-(--ms-accent)">
            Ciao, ti sta invitando {displayName}
          </p>

          <h1
            className="mt-3 animate-fade-up text-balance font-heading text-5xl font-bold tracking-tight"
            style={{ animationDelay: "80ms" }}
          >
            Anche tu per il caffè
          </h1>

          {phrase && (
            <p
              className="mt-5 animate-fade-up text-lg leading-relaxed text-(--ms-muted)"
              style={{ animationDelay: "160ms" }}
            >
              {phrase}
            </p>
          )}

          <div
            className="mt-10 flex animate-fade-up flex-wrap justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Button
              asChild
              size="lg"
              variant="accent"
              className="bg-(--ms-accent) text-(--ms-on-accent) hover:brightness-110"
            >
              <Link href="/registrati">
                Entra nella rete
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-(--ms-hairline) text-(--ms-fg) hover:bg-(--ms-fg)/8"
            >
              <Link href="/catalogo">Scopri il caffè</Link>
            </Button>
          </div>

          <p
            className="mt-6 animate-fade-up text-sm text-(--ms-muted)"
            style={{ animationDelay: "320ms" }}
          >
            Gratis, senza quote d&apos;ingresso.
          </p>
        </div>
      </div>
    </section>
  );
}
