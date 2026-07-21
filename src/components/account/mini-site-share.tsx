"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Il link della vetrina è l'elemento condiviso primario: contiene già
 * l'attribuzione, quindi non serve far ricordare un codice a nessuno.
 */
export function MiniSiteShare({
  url,
  displayUrl,
  slug,
}: {
  url: string;
  displayUrl: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copiato negli appunti");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Su http non sicuro o permessi negati la Clipboard API non è disponibile.
      toast("Non riusciamo a copiare: seleziona il link manualmente", "error");
    }
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-6 shadow-(--shadow-card)">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex rounded-xl bg-accent/15 p-2.5 text-accent-dark">
          <Store className="h-4 w-4" />
        </span>
        <p className="font-heading text-lg font-semibold text-coffee-900">La tua vetrina</p>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-coffee-600">
        Una pagina tutta tua, con il tuo codice già dentro. Mandala in chat o mettila nella bio:
        chi si registra da lì entra nella tua rete.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border border-coffee-100 bg-white px-3.5 py-2.5 text-sm text-coffee-800">
          {displayUrl}
        </code>
        <Button onClick={copy} variant={copied ? "accent" : "primary"} size="md">
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copiato
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copia
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link
          href={`/c/${slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 font-medium text-accent-dark transition-colors hover:text-accent"
        >
          Apri la pagina
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/account/vetrina"
          className="font-medium text-coffee-600 transition-colors hover:text-coffee-900"
        >
          Personalizza
        </Link>
      </div>
    </div>
  );
}
