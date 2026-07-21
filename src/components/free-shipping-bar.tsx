import { Truck, Check } from "lucide-react";
import { formatEuro } from "@/lib/utils";

/**
 * Mostra quanto manca alla spedizione gratuita.
 * La soglia esiste in StoreConfig ma non era mai esposta all'utente:
 * il carrello diceva solo "Gratuita" o una cifra, senza spiegare perché.
 */
export function FreeShippingBar({
  subtotalCents,
  thresholdCents,
}: {
  subtotalCents: number;
  thresholdCents: number;
}) {
  if (thresholdCents <= 0) return null;

  const reached = subtotalCents >= thresholdCents;
  const missing = Math.max(0, thresholdCents - subtotalCents);
  const percent = Math.min(100, Math.round((subtotalCents / thresholdCents) * 100));

  return (
    <div className="rounded-xl border border-coffee-100 bg-coffee-50/60 p-4">
      <div className="flex items-start gap-2.5">
        <span className={reached ? "mt-0.5 text-emerald-600" : "mt-0.5 text-accent-dark"}>
          {reached ? <Check className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
        </span>
        <p className="text-sm leading-snug text-coffee-700">
          {reached ? (
            <>
              <span className="font-semibold text-emerald-700">Spedizione gratuita</span> inclusa
              nel tuo ordine.
            </>
          ) : (
            <>
              Ti mancano <span className="font-semibold text-coffee-900">{formatEuro(missing)}</span>{" "}
              per la spedizione gratuita.
            </>
          )}
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-coffee-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso verso la spedizione gratuita"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out-quart ${
            reached ? "bg-emerald-500" : "bg-accent"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
