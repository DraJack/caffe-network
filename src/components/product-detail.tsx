"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, ArrowLeft, Minus, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { ProductImage } from "@/components/ui/product-image";
import { useToast } from "@/components/ui/toast";
import { MachinePicker, type MachineOption } from "@/components/product/machine-picker";
import { ShareProduct } from "@/components/product/share-product";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { formatEuro, cn } from "@/lib/utils";
import { parsePack, unitPriceCents, ROAST_STEPS, type BlendPart } from "@/lib/product";
import { addToCart } from "@/app/actions/cart";

type Variant = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  /** Foto del formato; se assente si usa quella del prodotto. */
  image?: string | null;
};

type Props = {
  slug: string;
  name: string;
  description: string;
  origin?: string | null;
  blend: BlendPart[] | null;
  roast?: string | null;
  image: string | null;
  categoryName?: string | null;
  variants: Variant[];
  machines: MachineOption[];
  freeShippingThresholdCents: number;
  /** Link con ?ref= dell'utente loggato; null per gli ospiti. */
  shareUrl: string | null;
  /** Rassicurazioni sotto la foto (renderizzate dal server). */
  aside?: ReactNode;
  /** Sezioni sotto la parte principale: profilo di gusto, FAQ (renderizzate dal server). */
  children?: ReactNode;
};

/** Soglia sotto la quale segnalare la scorsa bassa: crea urgenza onesta. */
const LOW_STOCK = 5;

export function ProductDetail({
  slug,
  name,
  description,
  origin,
  blend,
  roast,
  image,
  categoryName,
  variants,
  machines,
  freeShippingThresholdCents,
  shareUrl,
  aside,
  children,
}: Props) {
  const [selected, setSelected] = useState<Variant>(variants[0]);
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const ctaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const outOfStock = selected.stock <= 0;
  const lowStock = !outOfStock && selected.stock <= LOW_STOCK;
  const shownImage = selected.image ?? image;

  // Il primo paragrafo è la frase che racconta la miscela: va in evidenza,
  // il resto (formato, compatibilità, note legali) resta testo corrente.
  const [lead, ...body] = description.split(/\n\s*\n/);

  const pack = parsePack(selected.name);
  const unitPrice = pack
    ? `${formatEuro(unitPriceCents(selected.priceCents, pack))} a ${pack.unit}`
    : null;
  const roastLabel = ROAST_STEPS.find((s) => s.value === roast)?.label;
  const showPicker = machines.length > 1;
  const packLine = pack ? `Confezione da ${pack.count} ${pack.unitPlural}` : selected.name;
  // Nella card scelta: "Cialde · confezione da 150".
  const pickerSubtitle = pack
    ? `${categoryName ? `${categoryName} · ` : ""}confezione da ${pack.count}`
    : null;

  // Stessa regola di src/server/cart.ts. "Inclusa" resta vero anche con altro nel
  // carrello: aggiungere questa confezione può solo far salire il subtotale.
  const freeShipping =
    freeShippingThresholdCents <= 0 || selected.priceCents * qty >= freeShippingThresholdCents;

  const handleAdd = () => {
    startTransition(async () => {
      const res = await addToCart(selected.id, qty);
      if (!res.ok) {
        toast(res.error ?? "Impossibile aggiungere al carrello");
        return;
      }
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

      <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
        {/* La foto è 3:2: senza self-start la grid la stirava all'altezza del testo,
            lasciando un riquadro vuoto. Sotto ci sono rassicurazioni e scheda miscela,
            che pareggiano l'altezza della colonna destra (niente sticky: la colonna
            è più alta dello schermo e il fondo resterebbe nascosto). */}
        <div className="space-y-4 md:self-start">
          <div className="group overflow-hidden rounded-3xl bg-coffee-100 shadow-(--shadow-card)">
            <div className="aspect-[3/2]">
              <ProductImage
                // key: al cambio formato l'<img> si rimonta, azzerando lo stato di errore
                key={shownImage ?? "none"}
                src={shownImage}
                alt={name}
                className="transition-transform duration-700 ease-out-quart group-hover:scale-105"
              />
            </div>
          </div>
          {/* Su mobile le rassicurazioni starebbero tra foto e titolo: lì scendono sotto la CTA. */}
          {aside && <div className="hidden md:block">{aside}</div>}
        </div>

        <div>
          {categoryName && (
            <span className="text-sm font-medium uppercase tracking-wider text-accent-dark">
              {categoryName}
            </span>
          )}
          <h1 className="mt-2 text-balance font-heading text-4xl font-bold leading-tight tracking-tight text-coffee-900">
            {name}
          </h1>

          {/* Su desktop la scheda miscela è già accanto: le etichette servono solo su mobile. */}
          {blend || roastLabel ? (
            <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-coffee-700 md:hidden">
              {blend?.map((p) => (
                <li key={p.name} className="rounded-full bg-coffee-100 px-3 py-1">
                  {p.percent}% {p.name}
                </li>
              ))}
              {roastLabel && (
                <li className="rounded-full bg-coffee-100 px-3 py-1">Tostatura {roastLabel.toLowerCase()}</li>
              )}
            </ul>
          ) : (
            origin && <p className="mt-3 whitespace-pre-line text-sm text-coffee-600">{origin}</p>
          )}

          <p className="mt-6 text-balance font-heading text-xl font-semibold leading-snug text-accent-dark">
            {lead}
          </p>
          {body.map((para, i) => (
            <p key={i} className="mt-3 leading-relaxed text-coffee-700">
              {para}
            </p>
          ))}

          {/* Primo passo: la compatibilità. Il prezzo è uguale per tutti i formati. */}
          {showPicker && (
            <div className="mt-8">
              <MachinePicker options={machines} current={slug} subtitle={pickerSubtitle} />
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-coffee-100 bg-white p-5 shadow-(--shadow-soft) sm:p-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-heading text-4xl font-bold text-coffee-900">
                {formatEuro(selected.priceCents)}
              </span>
              {unitPrice && <span className="text-sm text-coffee-500">{unitPrice}</span>}
            </div>
            {/* Con il selettore la confezione è già scritta nella card scelta. */}
            {!showPicker && <p className="mt-1 text-sm text-coffee-600">{packLine}</p>}

            {/* Con una sola variante il selettore non offre scelte: lo si mostra solo se servono. */}
            {variants.length > 1 && (
              <div className="mt-6">
                <p className="mb-2.5 text-sm font-medium text-coffee-800">Confezione</p>
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
            )}

            {/* Quantità + CTA */}
            <div ref={ctaRef} className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-coffee-200 bg-white">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-l-xl text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Diminuisci quantità"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                  {qty}
                </span>
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
                      <ShoppingBag className="h-5 w-5" />
                      {/* A 390px "Aggiungi al carrello" andava a capo accanto alla quantità. */}
                      <span className="sm:hidden">Aggiungi</span>
                      <span className="hidden sm:inline">Aggiungi al carrello</span>
                    </>
                  )
                )}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              {outOfStock ? (
                <Badge variant="danger">Non disponibile</Badge>
              ) : lowStock ? (
                <Badge variant="warning">Ultimi {selected.stock} disponibili</Badge>
              ) : (
                <Badge variant="success">Disponibile · {selected.stock} pezzi</Badge>
              )}
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium",
                  freeShipping ? "text-emerald-700" : "text-coffee-600",
                )}
              >
                <Truck className="h-4 w-4" aria-hidden />
                {freeShipping
                  ? "Spedizione gratuita inclusa"
                  : `Spedizione gratuita da ${formatEuro(freeShippingThresholdCents)}`}
              </p>
            </div>

            {shareUrl && <ShareProduct url={shareUrl} productName={name} />}
          </div>

          {aside && <div className="mt-4 md:hidden">{aside}</div>}
        </div>
      </div>

      {children}

      {/* Sentinella: oltre questo punto la barra mobile sparisce e non copre il footer. */}
      <div ref={endRef} aria-hidden />

      <StickyBuyBar
        ctaRef={ctaRef}
        endRef={endRef}
        price={formatEuro(selected.priceCents)}
        unitPrice={unitPrice}
        disabled={outOfStock}
        pending={pending}
        added={added}
        onAdd={handleAdd}
      />
    </div>
  );
}
