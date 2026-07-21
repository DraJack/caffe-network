"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { ProductImage } from "@/components/ui/product-image";
import { useToast } from "@/components/ui/toast";
import { formatEuro, cn } from "@/lib/utils";
import { addToCart } from "@/app/actions/cart";

type Variant = { id: string; name: string; priceCents: number; stock: number };

type Props = {
  name: string;
  description: string;
  origin?: string | null;
  roast?: string | null;
  image: string | null;
  categoryName?: string | null;
  variants: Variant[];
};

const ROAST_LABEL: Record<string, string> = {
  LIGHT: "Tostatura chiara",
  MEDIUM: "Tostatura media",
  DARK: "Tostatura scura",
};

/** Soglia sotto la quale segnalare la scorsa bassa: crea urgenza onesta. */
const LOW_STOCK = 5;

export function ProductDetail({
  name,
  description,
  origin,
  roast,
  image,
  categoryName,
  variants,
}: Props) {
  const [selected, setSelected] = useState<Variant>(variants[0]);
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const outOfStock = selected.stock <= 0;
  const lowStock = !outOfStock && selected.stock <= LOW_STOCK;

  const handleAdd = () => {
    startTransition(async () => {
      await addToCart(selected.id, qty);
      setAdded(true);
      toast(`${name} · ${selected.name} aggiunto al carrello`);
      router.refresh();
      setTimeout(() => setAdded(false), 2000);
    });
  };

  /** Cambiando formato la quantità può superare il nuovo stock: va ricalibrata. */
  const selectVariant = (v: Variant) => {
    setSelected(v);
    setQty((q) => Math.max(1, Math.min(q, v.stock || 1)));
  };

  return (
    <div className="container-page py-10">
      <Link
        href="/catalogo"
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-coffee-600 transition-colors hover:text-coffee-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Torna al catalogo
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="group overflow-hidden rounded-3xl bg-coffee-100 shadow-(--shadow-card)">
          <div className="aspect-square">
            <ProductImage
              src={image}
              alt={name}
              className="transition-transform duration-700 ease-out-quart group-hover:scale-105"
            />
          </div>
        </div>

        <div>
          {categoryName && (
            <span className="text-sm font-medium uppercase tracking-wider text-accent-dark">
              {categoryName}
            </span>
          )}
          <h1 className="mt-2 font-heading text-4xl font-bold leading-tight tracking-tight text-coffee-900">
            {name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-coffee-600">
            {origin && <span>{origin}</span>}
            {origin && roast && <span className="text-coffee-300">·</span>}
            {roast && <span>{ROAST_LABEL[roast] ?? roast}</span>}
          </div>

          <p className="mt-5 leading-relaxed text-coffee-700">{description}</p>

          <div className="mt-7 font-heading text-4xl font-bold text-coffee-900">
            {formatEuro(selected.priceCents)}
          </div>

          {/* Varianti */}
          <div className="mt-7">
            <p className="mb-2.5 text-sm font-medium text-coffee-800">Formato</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const active = v.id === selected.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => selectVariant(v)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-coffee-800 text-cream shadow-(--shadow-soft)"
                        : "border border-coffee-200 bg-white text-coffee-700 hover:border-coffee-400 hover:bg-coffee-50",
                      v.stock <= 0 && !active && "opacity-50",
                    )}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantità + CTA */}
          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-coffee-200 bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex h-11 w-11 items-center justify-center rounded-l-xl text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Diminuisci quantità"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(selected.stock, q + 1))}
                disabled={qty >= selected.stock}
                className="flex h-11 w-11 items-center justify-center rounded-r-xl text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Aumenta quantità"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              onClick={handleAdd}
              disabled={outOfStock}
              loading={pending}
              size="lg"
              variant={added ? "accent" : "primary"}
              className="flex-1"
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> Aggiunto
                </>
              ) : outOfStock ? (
                "Esaurito"
              ) : (
                !pending && (
                  <>
                    <ShoppingBag className="h-5 w-5" /> Aggiungi al carrello
                  </>
                )
              )}
            </Button>
          </div>

          <div className="mt-4">
            {outOfStock ? (
              <Badge variant="danger">Non disponibile</Badge>
            ) : lowStock ? (
              <Badge variant="warning">Ultimi {selected.stock} disponibili</Badge>
            ) : (
              <Badge variant="success">Disponibile · {selected.stock} pezzi</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
