import Link from "next/link";
import { ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartItems } from "@/components/cart-items";
import { FreeShippingBar } from "@/components/free-shipping-bar";
import { getCart } from "@/server/cart";
import { getStoreConfig } from "@/lib/config";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Carrello" };

export default async function CartPage() {
  const [cart, config] = await Promise.all([getCart(), getStoreConfig()]);
  const total = cart.subtotalCents + cart.shippingCents;

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Il carrello è vuoto"
          description="Non hai ancora aggiunto nulla. Dai un'occhiata alle nostre miscele e ai single origin."
          action={{ label: "Vai al catalogo", href: "/catalogo" }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-coffee-900">Carrello</h1>
      <p className="mt-2 text-coffee-600">
        {cart.count} {cart.count === 1 ? "articolo" : "articoli"} nel carrello
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="rounded-2xl border border-coffee-100 bg-white px-5 shadow-(--shadow-card)">
          <CartItems items={cart.items} />
        </div>

        {/* Riepilogo sticky: resta a vista mentre si scorrono gli articoli */}
        <aside className="rounded-2xl border border-coffee-100 bg-white p-6 shadow-(--shadow-card) lg:sticky lg:top-24">
          <h2 className="font-heading text-xl font-semibold text-coffee-900">Riepilogo</h2>

          <div className="mt-5">
            <FreeShippingBar
              subtotalCents={cart.subtotalCents}
              thresholdCents={config.freeShippingThreshold}
            />
          </div>

          <dl className="mt-5 space-y-2.5 text-sm">
            <Row label="Subtotale" value={formatEuro(cart.subtotalCents)} />
            <Row
              label="Spedizione"
              value={cart.shippingCents === 0 ? "Gratuita" : formatEuro(cart.shippingCents)}
              highlight={cart.shippingCents === 0}
            />
            <div className="my-3 border-t border-coffee-100" />
            <Row label="Totale" value={formatEuro(total)} strong />
          </dl>

          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/checkout">
              Vai al checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-coffee-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pagamento sicuro tramite Stripe
          </p>

          <Link
            href="/catalogo"
            className="mt-4 block text-center text-sm text-coffee-600 transition-colors hover:text-coffee-900"
          >
            Continua lo shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  highlight,
}: {
  label: string;
  value: string;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-coffee-900" : "text-coffee-600"}>{label}</dt>
      <dd
        className={
          strong
            ? "font-heading text-xl font-bold text-coffee-900"
            : highlight
              ? "font-medium text-emerald-700"
              : "text-coffee-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}
