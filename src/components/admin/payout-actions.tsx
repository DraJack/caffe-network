"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { markPayoutPaid, rejectPayout } from "@/app/actions/admin";

export function PayoutActions({ payoutId }: { payoutId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (pending) return <Loader2 className="h-4 w-4 animate-spin text-coffee-500" />;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {/* Entrambe le azioni sono irreversibili — "Pagata" dichiara che il bonifico
            è già stato eseguito — quindi richiedono una conferma esplicita. */}
        <ConfirmButton
          size="sm"
          variant="primary"
          confirmLabel="Bonifico eseguito?"
          onConfirm={() =>
            startTransition(async () => {
              const res = await markPayoutPaid(payoutId);
              setError(res.error ?? null);
            })
          }
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
      {error && (
        <p className="flex max-w-[280px] items-start gap-1 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
