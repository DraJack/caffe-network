import { formatEuro } from "@/lib/utils";
import type { Pack } from "@/lib/product";

// ⚠️ BOZZA da rivedere prima del go-live (CLAUDE.md §8): termini di vendita e recesso
// non sono ancora definitivi. Spedizione e recesso ripetono ciò che dice /spedizioni —
// se cambi lì, cambia anche qui. Nessun tempo di consegna promesso.

type FaqInput = {
  machine: string;
  pack: Pack | null;
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  /** Prezzo della confezione, per dire se da sola raggiunge la soglia. */
  priceCents: number;
};

export type Faq = { q: string; a: string; href?: { label: string; url: string } };

export function productFaqs({
  machine,
  pack,
  flatShippingCents,
  freeShippingThresholdCents,
  priceCents,
}: FaqInput): Faq[] {
  const units = pack?.unitPlural ?? "confezioni";
  const isCialda = pack?.unit === "cialda";

  const faqs: Faq[] = [
    {
      q: `Questo formato va bene per la mia macchina?`,
      a:
        `Questo formato è compatibile con le macchine ${machine}. Se ne hai un'altra, scegli il ` +
        `formato giusto da «La tua macchina»: la miscela Gran Crema è la stessa in tutti i formati.` +
        (isCialda
          ? " Per le cialde conta il diametro: controlla se il portacialda della tua macchina è da 44 o da 38 mm."
          : ""),
    },
    {
      q: `Come conservo le ${units}?`,
      a:
        "In un luogo fresco e asciutto, lontano da fonti di calore e dalla luce diretta del sole. " +
        "Dopo l'apertura richiudi bene la confezione: aria e umidità sono i nemici dell'aroma.",
    },
  ];

  if (pack) {
    const months = Math.round(pack.count / 30);
    faqs.push({
      q: "Quanto dura una confezione?",
      a:
        `Una confezione contiene ${pack.count} ${units}: con un caffè al giorno dura circa ` +
        `${months} ${months === 1 ? "mese" : "mesi"}, con due circa la metà.`,
    });
  }

  // Stessa regola di src/server/cart.ts: gratuita se subtotale >= soglia.
  const alwaysFree = freeShippingThresholdCents <= 0;
  faqs.push({
    q: "Quanto costa la spedizione?",
    a: alwaysFree
      ? "La spedizione è sempre gratuita, in tutta Italia."
      : `La spedizione costa ${formatEuro(flatShippingCents)} ed è gratuita per ordini da ` +
        `${formatEuro(freeShippingThresholdCents)}` +
        (priceCents >= freeShippingThresholdCents
          ? `: questa confezione da sola la include già.`
          : ".") +
        " Consegniamo in tutta Italia.",
    href: { label: "Spedizioni e resi", url: "/spedizioni" },
  });

  faqs.push(
    {
      q: "Posso restituire il prodotto?",
      a:
        "Sì: hai 14 giorni dalla consegna per recedere, come previsto dal Codice del Consumo. " +
        `Trattandosi di un alimento, la confezione va restituita integra e non aperta.`,
      href: { label: "Spedizioni e resi", url: "/spedizioni" },
    },
    {
      q: "Il pagamento è sicuro?",
      a:
        "Sì. I pagamenti sono gestiti da Stripe: i dati della carta non passano dai nostri server " +
        "e, quando la banca lo richiede, l'acquisto viene confermato con 3D Secure.",
    },
  );

  return faqs;
}
