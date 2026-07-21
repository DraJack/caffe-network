import { ChevronDown } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import { COMMISSION_DEPTH } from "@/lib/commissions";
import { Reveal } from "@/components/ui/reveal";

type Props = {
  config: {
    commissionMaturationDays: number;
    commissionFallbackDays: number;
    minPayoutCents: number;
  };
};

/**
 * FAQ in <details> nativi: nessun JavaScript, apribili da tastiera, indicizzabili.
 *
 * ⚠️ La domanda sul fisco NON dà consulenza fiscale e non deve iniziare a darla:
 * indica l'esistenza dell'obbligo e rimanda a un commercialista.
 */
export function ConsultantFaq({ config }: Props) {
  const faqs = [
    {
      q: "Quanto costa iniziare?",
      a: "Nulla. Non esiste una quota di iscrizione, non c'è un kit da comprare e non c'è un ordine minimo da mantenere. Basta un account gratuito.",
    },
    {
      q: "Devo comprare prodotti per guadagnare?",
      a: "No. Le provvigioni nascono dagli acquisti delle persone della tua rete, non dai tuoi. Puoi guadagnare senza aver mai fatto un ordine.",
    },
    {
      q: "Guadagno qualcosa quando invito una persona?",
      a: "No, e questa è una scelta di fondo: l'iscrizione di per sé non produce alcun compenso. Si guadagna solo quando qualcuno acquista davvero del caffè. È la differenza fra la vendita diretta e uno schema piramidale.",
    },
    {
      q: "Quando e come vengo pagato?",
      a: `La provvigione viene registrata appena l'ordine risulta pagato e diventa prelevabile ${config.commissionMaturationDays} giorni dopo la consegna, per lasciar passare i termini di reso. Se la consegna non viene mai registrata, matura comunque entro ${config.commissionFallbackDays} giorni dal pagamento. Dal saldo disponibile puoi richiedere un bonifico a partire da ${formatEuro(config.minPayoutCents)}, indicando l'IBAN al momento della richiesta.`,
    },
    {
      q: "Cosa succede se un cliente annulla l'ordine o rende il prodotto?",
      a: "La provvigione collegata a quell'ordine viene stornata, perché il presupposto era una vendita che non c'è più. È il motivo per cui esiste il periodo di maturazione: serve a evitare che venga pagato del denaro su un ordine che potrebbe tornare indietro.",
    },
    {
      q: "Devo aprire la partita IVA?",
      a: "Dipende da quanto guadagni. Le provvigioni della vendita diretta hanno un loro trattamento fiscale, con una ritenuta d'acconto e delle soglie oltre le quali scattano obblighi ulteriori. Non possiamo darti una risposta valida per la tua situazione: parlane con un commercialista prima di superare importi rilevanti.",
    },
    {
      q: "Quante persone posso invitare?",
      a: `Non c'è un limite al numero di persone che puoi invitare direttamente. Il piano riconosce provvigioni fino al ${COMMISSION_DEPTH}° livello di profondità: oltre quello, gli acquisti non generano più compensi per te.`,
    },
    {
      q: "Posso smettere quando voglio?",
      a: "Sì. Non ci sono vincoli di durata né obiettivi da raggiungere per restare attivo. Le provvigioni già maturate restano tue e puoi richiederne il pagamento.",
    },
  ];

  return (
    <div className="max-w-3xl">
      <Reveal>
        <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
          Domande frequenti
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold text-coffee-900">
          Quello che di solito ci chiedono
        </h2>
      </Reveal>

      <div className="mt-8 space-y-3">
        {faqs.map((faq, i) => (
          <Reveal key={faq.q} delay={i * 50}>
            <details className="group rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-soft) transition-shadow duration-300 open:shadow-(--shadow-card)">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-coffee-900 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-coffee-400 transition-transform duration-300 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-coffee-600">{faq.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
