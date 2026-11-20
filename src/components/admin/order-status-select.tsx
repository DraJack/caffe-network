"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/app/actions/admin";
import { ORDER_TRANSITIONS, orderStatus } from "@/lib/order-status";

const ALL: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export function OrderStatusSelect({ orderId, value }: { orderId: string; value: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<OrderStatus>(value);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Solo lo stato attuale + i passaggi ammessi: le scelte che salterebbero gli
  // effetti collaterali (stock, provvigioni) non vengono proprio offerte.
  const allowed = new Set<string>([current, ...(ORDER_TRANSITIONS[current] ?? [])]);
  const terminal = (ORDER_TRANSITIONS[current] ?? []).length === 0;

  return (
    <div className="space-y-1">
      <select
        value={current}
        disabled={pending || terminal}
        onChange={(e) => {
          const next = e.target.value as OrderStatus;
          if (next === "CANCELLED" && !window.confirm("Annullare l'ordine? Stock e provvigioni verranno stornati.")) {
            return;
          }
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, next);
            if (res.error) {
              setMessage({ text: res.error, error: true });
              return;
            }
            setCurrent(next);
            // L'annullamento di un ordine con provvigioni già liquidate non è
            // reversibile in automatico: va mostrato, non ingoiato.
            setMessage(res.warning ? { text: res.warning, error: false } : null);
          });
        }}
        className="rounded-lg border border-coffee-200 bg-white px-2 py-1 text-sm text-coffee-800 disabled:opacity-50"
      >
        {ALL.filter((s) => allowed.has(s)).map((s) => (
          <option key={s} value={s}>
            {orderStatus(s).label}
          </option>
        ))}
      </select>

      {message && (
        <p
          className={`flex max-w-[260px] items-start gap-1 text-xs ${message.error ? "text-red-700" : "text-amber-700"}`}
        >
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {message.text}
        </p>
      )}
    </div>
  );
}
