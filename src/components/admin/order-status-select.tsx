"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/app/actions/admin";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "In attesa" },
  { value: "PAID", label: "Pagato" },
  { value: "SHIPPED", label: "Spedito" },
  { value: "DELIVERED", label: "Consegnato" },
  { value: "CANCELLED", label: "Annullato" },
];

export function OrderStatusSelect({ orderId, value }: { orderId: string; value: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const [warning, setWarning] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <select
        defaultValue={value}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, e.target.value as OrderStatus);
            // L'annullamento di un ordine con provvigioni già liquidate non è
            // reversibile in automatico: va mostrato, non ingoiato.
            setWarning(res?.warning ?? null);
          })
        }
        className="rounded-lg border border-coffee-200 bg-white px-2 py-1 text-sm text-coffee-800 disabled:opacity-50"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {warning && (
        <p className="flex max-w-[260px] items-start gap-1 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {warning}
        </p>
      )}
    </div>
  );
}
