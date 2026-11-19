import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { formatEuro } from "@/lib/utils";

/**
 * Le tre rassicurazioni sotto la foto. Riempiono la colonna che prima restava un
 * riquadro vuoto, e rispondono ai dubbi che bloccano un primo acquisto.
 * Soglia e costi vengono da StoreConfig, come in /spedizioni.
 */
export function TrustBadges({ freeShippingThresholdCents }: { freeShippingThresholdCents: number }) {
  const items = [
    {
      icon: Truck,
      title: "Spedizione gratuita",
      body:
        freeShippingThresholdCents > 0
          ? `Da ${formatEuro(freeShippingThresholdCents)}, in tutta Italia`
          : "In tutta Italia",
    },
    { icon: ShieldCheck, title: "Pagamento sicuro", body: "Stripe con 3D Secure" },
    { icon: RotateCcw, title: "Recesso 14 giorni", body: "Dalla consegna" },
  ];

  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map(({ icon: Icon, title, body }) => (
        <li
          key={title}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-coffee-100 bg-white px-2 py-4 text-center shadow-(--shadow-soft) sm:px-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coffee-900 text-accent">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-semibold text-coffee-900 sm:text-sm">{title}</span>
          <span className="text-[11px] leading-snug text-coffee-500 sm:text-xs">{body}</span>
        </li>
      ))}
    </ul>
  );
}
