import Link from "next/link";
import { Share2, Coins, Wallet, ArrowRight } from "lucide-react";
import { getStoreConfig } from "@/lib/config";
import { formatEuro, cn } from "@/lib/utils";
import { COMMISSION_DEPTH, levelRateCents, planTotalCents } from "@/lib/commissions";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { NetworkSimulator } from "@/components/consulenti/network-simulator";
import { TimelineToPayout } from "@/components/consulenti/timeline-to-payout";
import { MiniSiteTeaser } from "@/components/consulenti/mini-site-teaser";
import { ConsultantFaq } from "@/components/consulenti/consultant-faq";

export const dynamic = "force-dynamic";

// È la pagina che i consulenti condivideranno per invitare: la preview social conta.
const description =
  "Guadagna su ogni confezione acquistata dalla tua rete, fino al 5° livello. Nessuna quota d'ingresso, piano provvigionale pubblicato per intero.";

export const metadata = {
  title: "Piano provvigionale",
  description,
  openGraph: {
    title: "Piano provvigionale — Caffè Network",
    description,
    type: "website",
  },
};

export default async function ConsulentiPage() {
  const config = await getStoreConfig();
  const levels = Array.from({ length: COMMISSION_DEPTH }, (_, i) => i + 1);
  const planCents = planTotalCents(config);
  const reference = 5000; // confezione di riferimento

  // Le tariffe partono da qui e attraversano tutta la pagina: il simulatore è un
  // client component, quindi le riceve già risolte da StoreConfig.
  const ratesCents = levels.map((l) => levelRateCents(l, config));

  // Per la barra proporzionale nella tabella: il livello più ricco vale 100%.
  const maxRate = Math.max(...levels.map((l) => levelRateCents(l, config)));

  return (
    <>
      {/* Intestazione su fondo scuro: la pagina che vende il modello merita un hero */}
      <section className="relative isolate overflow-hidden bg-coffee-950 text-cream">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(201,146,43,0.2),transparent_60%)]"
        />
        <div className="grain absolute inset-0 -z-10" aria-hidden />
        <div className="container-page py-20">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full border border-coffee-700/60 bg-coffee-900/60 px-4 py-1.5 text-sm text-accent">
              Nessuna quota d&apos;ingresso
            </p>
            <h1 className="animate-fade-up text-balance font-heading text-5xl font-bold leading-[1.05] tracking-tight">
              Guadagna con la tua rete
            </h1>
            <p
              className="mt-6 animate-fade-up text-lg leading-relaxed text-coffee-200"
              style={{ animationDelay: "100ms" }}
            >
              Ogni cliente che inviti ti riconosce una provvigione su ogni confezione che acquista.
              E quando le persone che hai invitato invitano a loro volta, guadagni anche su di loro,
              fino al {COMMISSION_DEPTH}° livello.
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-14">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: <Share2 className="h-5 w-5" />,
              title: "Condividi il tuo link",
              body: "Ogni account ha un codice invito personale. Chi si registra dal tuo link entra nella tua rete.",
            },
            {
              icon: <Coins className="h-5 w-5" />,
              title: "Guadagni sugli acquisti",
              body: "La provvigione matura su acquisti reali di prodotto, mai sull'iscrizione di nuove persone.",
            },
            {
              icon: <Wallet className="h-5 w-5" />,
              title: "Richiedi il pagamento",
              body: `Dal tuo account segui il saldo e richiedi il bonifico da ${formatEuro(config.minPayoutCents)} in su.`,
            },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 90}>
              <div className="h-full rounded-2xl border border-coffee-100 bg-white p-7 shadow-(--shadow-card) transition-all duration-300 hover:-translate-y-1 hover:shadow-(--shadow-lift)">
                <div className="inline-flex rounded-2xl bg-accent/12 p-3.5 text-accent-dark">
                  {item.icon}
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-coffee-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-coffee-600">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Simulatore: la forma della rete e il guadagno che ne deriva sono la stessa
          cosa, quindi vivono nello stesso componente. Muovere lo slider ridisegna
          la piramide. */}
      <section className="border-y border-coffee-100 bg-white/60">
        <div className="container-page py-16">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
                Prova a fare due conti
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-coffee-900 md:text-4xl">
                Che forma avrebbe la tua rete
              </h2>
              <p className="mt-4 leading-relaxed text-coffee-600">
                Sposta i cursori e guarda cosa succede. Il numero grande non arriva mai da solo:
                accanto trovi sempre quante persone servirebbero per ottenerlo, perché è quello
                il lavoro vero.
              </p>
            </div>
          </Reveal>

          <div className="mt-10">
            <NetworkSimulator ratesCents={ratesCents} minPayoutCents={config.minPayoutCents} />
          </div>
        </div>
      </section>

      <div className="container-page py-14">
        {/* Il piano va pubblicato per intero: è un obbligo di trasparenza, non marketing.
            Tutti i numeri vengono da StoreConfig — non scriverne mai a mano. */}
        <Reveal>
          <h2 className="font-heading text-3xl font-bold text-coffee-900">
            Da dove escono questi numeri
          </h2>
          <p className="mt-3 max-w-2xl text-coffee-600">
            Importi fissi per ogni confezione acquistata da qualcuno della tua rete. Il livello 1 è
            chi hai invitato direttamente.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-7 max-w-2xl overflow-hidden rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-card)">
            <table className="w-full text-sm">
              <thead className="bg-coffee-50 text-left text-coffee-600">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Livello</th>
                  <th className="px-5 py-3.5 font-medium">Chi è</th>
                  <th className="px-5 py-3.5 text-right font-medium">Per confezione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {levels.map((l) => {
                  const rate = levelRateCents(l, config);
                  return (
                    <tr key={l} className="transition-colors hover:bg-coffee-50/60">
                      <td className="px-5 py-3.5 font-medium text-coffee-900">Livello {l}</td>
                      <td className="px-5 py-3.5 text-coffee-600">
                        {l === 1 ? "Chi hai invitato tu" : `A ${l} passaggi da te`}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-3">
                          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-coffee-100 sm:block">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${maxRate ? (rate / maxRate) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="font-heading font-semibold tabular-nums text-coffee-900">
                            {formatEuro(rate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-coffee-800 text-cream">
                  <td className="px-5 py-4 font-semibold" colSpan={2}>
                    Totale distribuito
                  </td>
                  <td className="px-5 py-4 text-right font-heading text-lg font-bold">
                    {formatEuro(planCents)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>

        <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            {
              title: "Esempio",
              body: (
                <>
                  Una persona che hai invitato compra 3 confezioni da {formatEuro(reference)}: tu
                  ricevi {formatEuro(levelRateCents(1, config) * 3)}. Se a comprare è qualcuno che si
                  trova due passaggi sotto di te, ricevi{" "}
                  {formatEuro(levelRateCents(2, config) * 3)}.
                </>
              ),
            },
            {
              title: "Quando incassi",
              body: (
                <>
                  La provvigione matura all&apos;ordine e diventa prelevabile{" "}
                  {config.commissionMaturationDays} giorni dopo la consegna, così sono passati i
                  termini per un eventuale reso. Se un ordine viene annullato, la relativa
                  provvigione viene stornata.
                </>
              ),
            },
            {
              title: "Tetto massimo",
              body: (
                <>
                  Le provvigioni complessive di un ordine non superano il{" "}
                  {config.maxCommissionPercent}% del suo valore netto. Su un ordine scontato gli
                  importi vengono ridotti in proporzione.
                </>
              ),
            },
            {
              title: "Nessun costo di ingresso",
              body: (
                <>
                  Partecipare è gratuito e non esiste alcun guadagno legato all&apos;iscrizione di
                  nuove persone: si guadagna solo su vendite reali di prodotto.
                </>
              ),
            },
          ].map((note, i) => (
            <Reveal key={note.title} delay={i * 70}>
              <div
                className={cn(
                  "h-full rounded-2xl border border-coffee-100 bg-white p-5 shadow-(--shadow-soft)",
                )}
              >
                <h3 className="font-heading font-semibold text-coffee-900">{note.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-coffee-600">{note.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

      </div>

      <section className="container-page py-16">
        <TimelineToPayout config={config} />
      </section>

      <section className="border-y border-coffee-100 bg-white/60">
        <div className="container-page py-16">
          <MiniSiteTeaser />
        </div>
      </section>

      <section className="container-page py-16">
        <ConsultantFaq config={config} />
      </section>

      <div className="container-page pb-20">
        <Reveal delay={120}>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/registrati">
                Crea il tuo account gratuito
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/account/rete">Ho già un account</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </>
  );
}
