"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Il codice invito, in secondo piano rispetto al link della vetrina.
 * Serve per i casi che il link non copre: dettarlo a voce o scriverlo a mano.
 * L'alfabeto dei codici è già senza caratteri ambigui apposta (src/lib/referral.ts).
 */
export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast("Codice copiato negli appunti");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Su http non sicuro o permessi negati la Clipboard API non è disponibile.
      toast("Non riusciamo a copiare: seleziona il codice manualmente", "error");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-coffee-100 bg-white px-5 py-4 shadow-(--shadow-soft)">
      <p className="text-sm text-coffee-600">
        Da dettare a voce, se il link non è comodo:{" "}
        <span className="font-mono font-semibold text-coffee-900">{code}</span>
      </p>
      <Button onClick={copy} variant="ghost" size="sm" className="ml-auto">
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copiato
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copia
          </>
        )}
      </Button>
    </div>
  );
}
