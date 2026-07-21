"use client";

import { useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { markPayoutPaid, rejectPayout } from "@/app/actions/admin";

export function PayoutActions({ payoutId }: { payoutId: string }) {
  const [pending, startTransition] = useTransition();

  if (pending) return <Loader2 className="h-4 w-4 animate-spin text-coffee-500" />;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Entrambe le azioni sono irreversibili — "Pagata" dichiara che il bonifico
          è già stato eseguito — quindi richiedono una conferma esplicita. */}
      <ConfirmButton
        size="sm"
        variant="primary"
        confirmLabel="Bonifico eseguito?"
        onConfirm={() => startTransition(() => markPayoutPaid(payoutId))}
        title="Segna come pagata dopo aver eseguito il bonifico"
      >
        <Check className="h-4 w-4" /> Pagata
      </ConfirmButton>

      <ConfirmButton
        size="sm"
        variant="outline"
        confirmLabel="Rifiutare?"
        onConfirm={() => startTransition(() => rejectPayout(payoutId))}
      >
        <X className="h-4 w-4" /> Rifiuta
      </ConfirmButton>
    </div>
  );
}
