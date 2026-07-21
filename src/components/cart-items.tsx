"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Minus, Plus, Loader2 } from "lucide-react";
import { formatEuro, cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/product-image";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useToast } from "@/components/ui/toast";
import { updateCartItem, removeCartItem } from "@/app/actions/cart";

type Item = {
  id: string;
  name: string;
  variantName: string;
  slug: string;
  image: string | null;
  quantity: number;
  priceCents: number;
  lineCents: number;
  stock: number;
};

export function CartItems({ items }: { items: Item[] }) {
  const [, startTransition] = useTransition();
  // Prima il pending era globale: lo spinner girava su TUTTE le righe insieme.
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const change = (id: string, fn: () => Promise<unknown>, message?: string) => {
    setBusyId(id);
    startTransition(async () => {
      await fn();
      router.refresh();
      setBusyId(null);
      if (message) toast(message);
    });
  };

  return (
    <ul className="divide-y divide-coffee-100">
      {items.map((it) => {
        const busy = busyId === it.id;
        return (
          <li
            key={it.id}
            className={cn(
              "flex gap-4 py-5 transition-opacity duration-200",
              busy && "pointer-events-none opacity-50",
            )}
          >
            <Link
              href={`/prodotto/${it.slug}`}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-coffee-100"
            >
              <ProductImage src={it.image} alt={it.name} />
            </Link>

            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-3">
                <div>
                  <Link
                    href={`/prodotto/${it.slug}`}
                    className="font-medium text-coffee-900 transition-colors hover:text-accent-dark"
                  >
                    {it.name}
                  </Link>
                  <p className="text-sm text-coffee-500">{it.variantName}</p>
                </div>
                <p className="shrink-0 font-heading font-semibold text-coffee-900">
                  {formatEuro(it.lineCents)}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-lg border border-coffee-200 bg-white">
                  <button
                    onClick={() => change(it.id, () => updateCartItem(it.id, it.quantity - 1))}
                    disabled={busy}
                    className="flex h-8 w-8 items-center justify-center rounded-l-lg text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-40"
                    aria-label={`Diminuisci quantità di ${it.name}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">
                    {busy ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : it.quantity}
                  </span>
                  <button
                    onClick={() => change(it.id, () => updateCartItem(it.id, it.quantity + 1))}
                    disabled={busy || it.quantity >= it.stock}
                    className="flex h-8 w-8 items-center justify-center rounded-r-lg text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-40"
                    aria-label={`Aumenta quantità di ${it.name}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <ConfirmButton
                  size="sm"
                  disabled={busy}
                  onConfirm={() =>
                    change(it.id, () => removeCartItem(it.id), `${it.name} rimosso dal carrello`)
                  }
                  confirmLabel="Confermi?"
                  className="text-coffee-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Rimuovi
                </ConfirmButton>
              </div>

              {it.quantity >= it.stock && (
                <p className="mt-2 text-xs text-amber-700">
                  Hai raggiunto la disponibilità massima per questo formato.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
