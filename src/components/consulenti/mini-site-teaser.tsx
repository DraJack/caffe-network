import Link from "next/link";
import { ArrowRight, Coffee, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { MINI_SITE_THEMES } from "@/lib/mini-site";

/**
 * Promuove la vetrina personale /c/[slug].
 * Il mockup usa i token reali del tema Notte, così non può divergere dalla
 * pagina che sta promettendo.
 *
 * ⚠️ Lo slug del mockup è puramente illustrativo: non va reso un link, punterebbe
 * a un profilo inesistente.
 */
export function MiniSiteTeaser() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
          La tua vetrina
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold text-coffee-900">
          Una pagina tutta tua, da condividere
        </h2>
        <p className="mt-4 leading-relaxed text-coffee-600">
          Ogni account ha già la sua vetrina, pronta dal primo giorno: il tuo nome, la tua
          atmosfera e i caffè in evidenza del catalogo. Chi si registra da lì entra
          automaticamente nella tua rete, senza che nessuno debba ricordarsi un codice.
        </p>
        <p className="mt-3 leading-relaxed text-coffee-600">
          È un indirizzo pulito da mettere nella bio di Instagram o da mandare in chat, al
          posto di un link pieno di parametri.
        </p>
        <div className="mt-7">
          <Button asChild variant="primary">
            <Link href="/registrati">
              Ottieni la tua vetrina
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="overflow-hidden rounded-2xl border border-coffee-200 bg-white shadow-(--shadow-lift)">
          {/* Finta barra del browser */}
          <div className="flex items-center gap-2 border-b border-coffee-100 bg-coffee-50 px-4 py-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-coffee-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-coffee-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-coffee-200" />
            </span>
            <span className="ml-2 flex min-w-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-coffee-500 ring-1 ring-coffee-100">
              <Link2 className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">
                caffenetwork.it/c/<span className="text-coffee-900">iltuonome</span>
              </span>
            </span>
          </div>

          {/* Contenuto stilizzato della vetrina.
              Ricalca la gerarchia reale della pagina: saluto, titolo, CTA. */}
          <div
            className="px-6 py-7"
            style={{ background: MINI_SITE_THEMES.NOTTE.bg, color: MINI_SITE_THEMES.NOTTE.fg }}
          >
            <p className="text-xs" style={{ color: MINI_SITE_THEMES.NOTTE.accent }}>
              Ciao, ti sta invitando
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">Giulia</p>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: MINI_SITE_THEMES.NOTTE.muted }}>
              Anche tu per il caffè
            </p>
            <span
              className="mt-4 inline-flex rounded-full px-3.5 py-1.5 text-xs font-medium"
              style={{
                background: MINI_SITE_THEMES.NOTTE.accent,
                color: MINI_SITE_THEMES.NOTTE.onAccent,
              }}
            >
              Entra nella rete
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 p-5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-coffee-100 p-2.5">
                <div className="flex aspect-square items-center justify-center rounded-lg bg-coffee-50">
                  <Coffee className="h-5 w-5 text-coffee-300" />
                </div>
                <div className="mt-2 h-1.5 w-3/4 rounded-full bg-coffee-100" />
                <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-coffee-100" />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
