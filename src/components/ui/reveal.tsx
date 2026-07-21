"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Ritardo in ms, per lo stagger di una lista. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
};

/**
 * Rivela i figli quando entrano nel viewport.
 * Riceve `children` come prop, così i Server Components che avvolge restano server.
 * Lo stato iniziale (.reveal) è in globals.css, insieme all'override per
 * `prefers-reduced-motion` e al fallback <noscript> nel root layout.
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: Props) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Niente useState: la visibilità è una classe sul nodo, cioè lo stato di un
    // sistema esterno (il DOM). Evita un render in più per ogni elemento rivelato.
    const reveal = () => node.classList.add("reveal-visible");

    // Se l'API non c'è, mostra subito: meglio senza animazione che invisibile.
    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect(); // una sola volta: non ri-anima allo scroll indietro
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("reveal", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
