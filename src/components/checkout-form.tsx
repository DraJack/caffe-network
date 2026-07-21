"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProductImage } from "@/components/ui/product-image";
import { formatEuro } from "@/lib/utils";
import { startCheckout, type CheckoutState } from "@/app/actions/checkout";

type CheckoutItem = {
  id: string;
  name: string;
  variantName: string;
  image: string | null;
  quantity: number;
  lineCents: number;
};

type Props = {
  subtotalCents: number;
  shippingCents: number;
  isLoggedIn: boolean;
  prefillName: string;
  prefillEmail: string;
  items: CheckoutItem[];
};

export function CheckoutForm(props: Props) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    startCheckout,
    undefined,
  );

  const total = props.subtotalCents + props.shippingCents;

  return (
    <div className="container-page py-10">
      <Link
        href="/carrello"
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-coffee-600 transition-colors hover:text-coffee-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Torna al carrello
      </Link>

      <h1 className="font-heading text-4xl font-bold tracking-tight text-coffee-900">Checkout</h1>

      <form action={formAction} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
        <div className="space-y-8">
          <Section step={1} title="Contatto">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={props.prefillEmail}
                required
              />
              <p className="mt-1.5 text-xs text-coffee-500">
                Ti inviamo qui la conferma d&apos;ordine.
              </p>
            </div>
          </Section>

          <Section step={2} title="Indirizzo di spedizione">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome e cognome</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  defaultValue={props.prefillName}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line1">Indirizzo</Label>
                <Input
                  id="line1"
                  name="line1"
                  autoComplete="address-line1"
                  placeholder="Via, numero civico"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line2">Interno / scala (facoltativo)</Label>
                <Input id="line2" name="line2" autoComplete="address-line2" />
              </div>
              <div>
                <Label htmlFor="city">Città</Label>
                <Input id="city" name="city" autoComplete="address-level2" required />
              </div>
              <div>
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  name="province"
                  autoComplete="address-level1"
                  placeholder="es. MI"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="postalCode">CAP</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
          </Section>

          {!props.isLoggedIn && (
            <div className="rounded-xl border border-coffee-200 bg-coffee-50/60 p-4 text-sm text-coffee-700">
              Hai un account?{" "}
              <Link
                href="/login"
                className="font-medium text-accent-dark transition-colors hover:text-accent"
              >
                Accedi
              </Link>{" "}
              per vedere i tuoi ordini e le tue provvigioni.
            </div>
          )}
        </div>

        {/* Riepilogo */}
        <aside className="rounded-2xl border border-coffee-100 bg-white p-6 shadow-(--shadow-card) lg:sticky lg:top-24">
          <h2 className="font-heading text-xl font-semibold text-coffee-900">Il tuo ordine</h2>

          <ul className="mt-5 space-y-3 border-b border-coffee-100 pb-5">
            {props.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-coffee-100">
                  <ProductImage src={it.image} alt={it.name} />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coffee-800 px-1 text-xs font-semibold text-cream">
                    {it.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-coffee-900">{it.name}</p>
                  <p className="text-xs text-coffee-500">{it.variantName}</p>
                </div>
                <p className="shrink-0 text-sm font-medium text-coffee-900">
                  {formatEuro(it.lineCents)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 text-sm">
            <Row label="Subtotale" value={formatEuro(props.subtotalCents)} />
            <Row
              label="Spedizione"
              value={props.shippingCents === 0 ? "Gratuita" : formatEuro(props.shippingCents)}
              highlight={props.shippingCents === 0}
            />
            <div className="my-3 border-t border-coffee-100" />
            <Row label="Totale" value={formatEuro(total)} strong />
          </dl>

          {state?.error && (
            <p className="mt-5 flex animate-fade-up items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" variant="accent" className="mt-6 w-full" loading={pending}>
            {!pending && (
              <>
                <Lock className="h-4 w-4" /> Paga {formatEuro(total)}
              </>
            )}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-coffee-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pagamento sicuro tramite Stripe (ambiente di test)
          </p>
        </aside>
      </form>
    </div>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-coffee-100 bg-white p-6 shadow-(--shadow-soft)">
      <h2 className="mb-4 flex items-center gap-2.5 font-heading text-lg font-semibold text-coffee-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coffee-800 text-sm font-semibold text-cream">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
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
