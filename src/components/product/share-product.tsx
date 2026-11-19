"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/**
 * Condivisione del prodotto con il proprio codice invito (?ref=), solo per utenti loggati.
 * ⚠️ Nessuna cifra di guadagno qui (L. 173/2005): si condivide un caffè, non un'opportunità.
 * Il piano provvigionale sta in /consulenti, generato da StoreConfig.
 */
export function ShareProduct({ url, productName }: { url: string; productName: string }) {
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
      toast("Non riusciamo a copiare il link", "error");
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${productName} ${url}`)}`;
  const btn =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-coffee-200 bg-white px-3 text-sm font-medium text-coffee-700 transition-colors hover:border-coffee-400 hover:bg-coffee-50";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-coffee-100 pt-5">
      <p className="mr-auto text-sm text-coffee-600">Condividi questo caffè</p>
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Copiato" : "Copia link"}
      </button>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btn}>
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
    </div>
  );
}
