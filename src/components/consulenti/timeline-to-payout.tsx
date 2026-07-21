import { UserPlus, Share2, ShoppingBag, Clock, Banknote } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

/* Tipo strutturale: StoreConfig lo soddisfa direttamente, come CommissionRules. */
type Props = {
  config: {
    commissionMaturationDays: number;
    commissionFallbackDays: number;
    minPayoutCents: number;
  };
};

/**
 * Rende visibile il ciclo PENDING → APPROVED → PAID, che finora la pagina
 * spiegava solo a parole in una nota.
 */
export function TimelineToPayout({ config }: Props) {
  const steps = [
    {
      icon: <UserPlus className="h-4 w-4" />,
      title: "Crei l'account",
      body: "Gratuito, in due minuti. Nessuna quota, nessun kit da acquistare, nessun minimo d'ordine.",
    },
    {
      icon: <Share2 className="h-4 w-4" />,
      title: "Condividi il tuo link",
      body: "Ricevi un codice invito personale. Chi si registra passando dal tuo link entra nella tua rete e ci resta.",
    },
    {
      icon: <ShoppingBag className="h-4 w-4" />,
      title: "Qualcuno della tua rete acquista",
      body: "La provvigione viene registrata nello stesso momento in cui l'ordine risulta pagato, e la vedi subito nel tuo account come «in maturazione».",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      title: "La provvigione matura",
      body: `Diventa prelevabile ${config.commissionMaturationDays} giorni dopo la consegna, così sono passati i termini per un eventuale reso. Se la consegna non viene mai registrata, matura comunque entro ${config.commissionFallbackDays} giorni dal pagamento: un ritardo non può bloccarti il guadagno.`,
    },
    {
      icon: <Banknote className="h-4 w-4" />,
      title: "Richiedi il bonifico",
      body: `Dal tuo account, appena il saldo disponibile raggiunge ${formatEuro(config.minPayoutCents)}. Indichi l'IBAN al momento della richiesta.`,
    },
  ];

  return (
    <div className="max-w-3xl">
      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
          Come si arriva al primo bonifico
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold text-coffee-900">
          Dalla registrazione al pagamento
        </h2>
      </Reveal>

      <ol className="mt-8 space-y-0">
        {steps.map((step, i) => (
          <Reveal key={step.title} as="li" delay={i * 80} className="relative flex gap-5 pb-8 last:pb-0">
            {/* Filo verticale che collega le tappe: si ferma prima dell'ultima */}
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-5 top-11 h-[calc(100%-1.75rem)] w-px bg-coffee-200"
              />
            )}

            <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coffee-800 text-accent shadow-(--shadow-soft)">
              {step.icon}
            </span>

            <div className="pt-1">
              <h3 className="font-heading text-lg font-semibold text-coffee-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-coffee-600">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
