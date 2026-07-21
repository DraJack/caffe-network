"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalcCommissionBalances } from "@/app/actions/admin";

/**
 * I saldi su CommissionAccount sono una cache del ledger. Questo pulsante li
 * riallinea: utile dopo un intervento manuale sul database.
 */
export function RecalcButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await recalcCommissionBalances();
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        })
      }
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : done ? (
        <>
          <Check className="h-4 w-4" /> Allineati
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" /> Ricalcola saldi
        </>
      )}
    </Button>
  );
}
