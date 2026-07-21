import { UserPlus, Share2, Wallet } from "lucide-react";
import { COMMISSION_DEPTH, levelRateCents, type CommissionRules } from "@/lib/commissions";
import { formatEuro } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

/**
 * Come funziona, in tre passi.
 * Gli importi arrivano da StoreConfig: se l'admin cambia le tariffe questa
 * sezione si aggiorna da sola. Scriverli a mano sarebbe un problema di
 * compliance, non solo di manutenzione (CLAUDE.md §8).
 */
export function MiniSitePlan({ config }: { config: CommissionRules }) {
  const levels = Array.from({ length: COMMISSION_DEPTH }, (_, i) => i + 1);
  const totalPerPack = levels.reduce((sum, l) => sum + levelRateCents(l, config), 0);

  const steps = [
    {
      icon: UserPlus,
      title: "Registrati gratis",
      body: "Nessuna quota d'ingresso e nessun acquisto obbligatorio. Bastano trenta secondi.",
    },
    {
      icon: Share2,
      title: "Condividi il tuo link",
      body: "Ricevi subito la tua pagina personale. Chi si registra da lì entra nella tua rete.",
    },
    {
      icon: Wallet,
      title: "Guadagni sugli ordini",
      body: `Fino a ${formatEuro(totalPerPack)} per confezione, distribuiti su ${COMMISSION_DEPTH} livelli di rete.`,
    },
  ];

  return (
    <section className="border-y border-coffee-100 bg-white/60">
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
            Come funziona
          </p>
          <h2 className="mt-3 text-balance font-heading text-4xl font-bold tracking-tight text-coffee-900">
            Bevi il caffè che ti piace, e intanto costruisci qualcosa
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <div className="h-full rounded-2xl border border-coffee-100 bg-white p-7 shadow-(--shadow-card) transition-all duration-300 ease-out-quart hover:-translate-y-1 hover:shadow-(--shadow-lift)">
                <span className="inline-flex rounded-2xl bg-accent/12 p-3.5 text-accent-dark">
                  <step.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold text-coffee-900">
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-coffee-600">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={270}>
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
            {levels.map((level) => (
              <span
                key={level}
                className="inline-flex items-center gap-2 rounded-full border border-coffee-200 bg-white px-4 py-2 text-sm text-coffee-700 shadow-(--shadow-soft)"
              >
                <span className="font-medium text-coffee-500">Livello {level}</span>
                <span className="font-heading font-semibold tabular-nums text-coffee-900">
                  {formatEuro(levelRateCents(level, config))}
                </span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
