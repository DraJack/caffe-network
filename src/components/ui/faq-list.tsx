import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export type FaqItem = { q: string; a: React.ReactNode };

/**
 * FAQ in <details> nativi: nessun JavaScript, apribili da tastiera, indicizzabili.
 * Condiviso da /consulenti e dalla pagina prodotto.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((faq, i) => (
        <Reveal key={faq.q} delay={i * 50}>
          <details className="group rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-soft) transition-shadow duration-300 open:shadow-(--shadow-card)">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-coffee-900 [&::-webkit-details-marker]:hidden">
              {faq.q}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-coffee-400 transition-transform duration-300 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-coffee-600">{faq.a}</div>
          </details>
        </Reveal>
      ))}
    </div>
  );
}
