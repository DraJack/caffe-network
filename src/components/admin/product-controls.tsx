"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toggleProductFlag, updateVariant } from "@/app/actions/admin";

export function ProductFlags({
  productId,
  active,
  featured,
}: {
  productId: string;
  active: boolean;
  featured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-3 text-sm">
      <label className="flex items-center gap-1.5 text-coffee-700">
        <input
          type="checkbox"
          defaultChecked={active}
          disabled={pending}
          onChange={(e) =>
            startTransition(() => toggleProductFlag(productId, "active", e.target.checked))
          }
          className="accent-coffee-800"
        />
        Attivo
      </label>
      <label className="flex items-center gap-1.5 text-coffee-700">
        <input
          type="checkbox"
          defaultChecked={featured}
          disabled={pending}
          onChange={(e) =>
            startTransition(() => toggleProductFlag(productId, "featured", e.target.checked))
          }
          className="accent-coffee-800"
        />
        In evidenza
      </label>
    </div>
  );
}

export function VariantEditor({
  variantId,
  name,
  priceCents,
  stock,
}: {
  variantId: string;
  name: string;
  priceCents: number;
  stock: number;
}) {
  const [price, setPrice] = useState((priceCents / 100).toFixed(2));
  const [qty, setQty] = useState(String(stock));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () =>
    startTransition(async () => {
      await updateVariant(variantId, Math.round(parseFloat(price) * 100) || 0, parseInt(qty) || 0);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="w-32 text-coffee-600">{name}</span>
      <label className="flex items-center gap-1">
        <span className="text-coffee-400">€</span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-20 rounded-lg border border-coffee-200 px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-coffee-400">stock</span>
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-16 rounded-lg border border-coffee-200 px-2 py-1"
        />
      </label>
      <button
        onClick={save}
        disabled={pending}
        className="rounded-lg bg-coffee-800 px-3 py-1 text-cream hover:bg-coffee-900 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          "Salva"
        )}
      </button>
    </div>
  );
}
