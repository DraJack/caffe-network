import Link from "next/link";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Un link condiviso che non risolve più (slug sbagliato, vetrina disattivata)
 * non deve sembrare un sito rotto: chi ci arriva è comunque un potenziale
 * cliente, quindi lo si accompagna al catalogo invece di lasciarlo su un 404.
 */
export default function MiniSiteNotFound() {
  return (
    <section className="relative isolate overflow-hidden bg-coffee-950 text-cream">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(201,146,43,0.18),transparent_65%)]"
      />
      <div className="grain absolute inset-0 -z-10" aria-hidden />

      <div className="container-page py-28">
        <div className="mx-auto max-w-lg text-center">
          <span className="inline-flex animate-scale-in rounded-2xl bg-coffee-800 p-4 text-accent">
            <Coffee className="h-7 w-7" />
          </span>
          <h1 className="mt-7 animate-fade-up font-heading text-4xl font-bold tracking-tight">
            Questa vetrina non esiste
          </h1>
          <p
            className="mt-4 animate-fade-up leading-relaxed text-coffee-300"
            style={{ animationDelay: "80ms" }}
          >
            Il link potrebbe essere scritto male o non essere più attivo. Il caffè però c&apos;è
            ancora: dai un&apos;occhiata al catalogo.
          </p>
          <div
            className="mt-9 flex animate-fade-up flex-wrap justify-center gap-3"
            style={{ animationDelay: "160ms" }}
          >
            <Button asChild size="lg" variant="accent">
              <Link href="/catalogo">Vai al catalogo</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-coffee-600 text-cream hover:border-coffee-500 hover:bg-coffee-800"
            >
              <Link href="/consulenti">Come funziona la rete</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
