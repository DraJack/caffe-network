"use client";

import { useActionState } from "react";
import { Loader2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatEuro } from "@/lib/utils";
import { requestPayout, type PayoutState } from "@/app/actions/commissions";

export function PayoutForm({
  availableCents,
  minPayoutCents,
  hasOpenRequest,
}: {
  availableCents: number;
  minPayoutCents: number;
  hasOpenRequest: boolean;
}) {
  const [state, formAction, pending] = useActionState<PayoutState, FormData>(
    requestPayout,
    undefined,
  );

  if (hasOpenRequest) {
    return (
      <div className="rounded-2xl border border-coffee-100 bg-white p-5 text-sm text-coffee-700">
        Hai una richiesta di prelievo in lavorazione. Ti avviseremo appena il bonifico
        sarà partito.
      </div>
    );
  }

  const belowMinimum = availableCents < minPayoutCents;

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-coffee-100 bg-white p-5">
      <div>
        <h2 className="font-semibold text-coffee-900">Richiedi il pagamento</h2>
        <p className="mt-1 text-sm text-coffee-600">
          {belowMinimum
            ? `Potrai richiedere il pagamento al raggiungimento di ${formatEuro(minPayoutCents)}.`
            : `Puoi richiedere ${formatEuro(availableCents)}. Il bonifico parte entro pochi giorni lavorativi.`}
        </p>
      </div>

      <div>
        <Label htmlFor="holderName">Intestatario del conto</Label>
        <Input id="holderName" name="holderName" required disabled={belowMinimum} />
      </div>
      <div>
        <Label htmlFor="iban">IBAN</Label>
        <Input id="iban" name="iban" placeholder="IT60 X054 2811 1010 0000 0123 456" required disabled={belowMinimum} />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p>
      )}

      <Button type="submit" disabled={pending || belowMinimum}>
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Banknote className="h-4 w-4" /> Richiedi {formatEuro(availableCents)}
          </>
        )}
      </Button>
    </form>
  );
}
