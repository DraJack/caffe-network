"use client";

import { useEffect, useState, type RefObject } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** La riga quantità + CTA principale: la barra compare quando esce dallo schermo. */
  ctaRef: RefObject<HTMLElement | null>;
  /** Fine del contenuto prodotto: oltre questo punto la barra sparisce, per non coprire il footer. */
  endRef: RefObject<HTMLElement | null>;
  price: string;
  unitPrice: string | null;
  disabled: boolean;
  pending: boolean;
  added: boolean;
  onAdd: () => void;
};

/**
 * Barra d'acquisto fissa, solo mobile. z-30: sotto header (40), drawer (50) e toast (60).
 */
export function StickyBuyBar({ ctaRef, endRef, price, unitPrice, disabled, pending, added, onAdd }: Props) {
  const [ctaVisible, setCtaVisible] = useState(true);
  const [pastEnd, setPastEnd] = useState(false);

  useEffect(() => {
    const cta = ctaRef.current;
    const end = endRef.current;
    if (!cta || !end) return;

    const ctaObs = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting));
    // "Oltre la fine" = la sentinella è visibile o già sopra il viewport.
    const endObs = new IntersectionObserver(([e]) =>
      setPastEnd(e.isIntersecting || e.boundingClientRect.top < 0),
    );
    ctaObs.observe(cta);
    endObs.observe(end);
    return () => {
      ctaObs.disconnect();
      endObs.disconnect();
    };
  }, [ctaRef, endRef]);

  const show = !ctaVisible && !pastEnd;

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-coffee-100 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-(--shadow-lift) backdrop-blur transition-transform duration-300 ease-out-quart md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="font-heading text-xl font-bold leading-none text-coffee-900">{price}</p>
          {unitPrice && <p className="mt-1 text-xs text-coffee-500">{unitPrice}</p>}
        </div>
        <Button onClick={onAdd} disabled={disabled} loading={pending} variant={added ? "accent" : "primary"} className="ml-auto flex-1">
          {added ? (
            <>
              <Check className="h-4 w-4" /> Aggiunto
            </>
          ) : disabled ? (
            "Esaurito"
          ) : (
            !pending && (
              <>
                <ShoppingBag className="h-4 w-4" /> Aggiungi
              </>
            )
          )}
        </Button>
      </div>
    </div>
  );
}
