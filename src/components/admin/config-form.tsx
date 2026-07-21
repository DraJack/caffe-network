"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatEuro } from "@/lib/utils";
import { updateStoreConfig } from "@/app/actions/admin";

type Config = {
  flatShippingCents: number;
  freeShippingThreshold: number;
  commissionL1Cents: number;
  commissionL2Cents: number;
  commissionL3Cents: number;
  commissionL4Cents: number;
  commissionL5Cents: number;
  maxCommissionPercent: number;
  commissionMaturationDays: number;
  commissionFallbackDays: number;
  minPayoutCents: number;
};

const euro = (cents: number) => (cents / 100).toFixed(2);
const toCents = (v: string) => Math.round(parseFloat(v) * 100) || 0;

export function ConfigForm({ config }: { config: Config }) {
  const [form, setForm] = useState({
    flatShipping: euro(config.flatShippingCents),
    freeShipping: euro(config.freeShippingThreshold),
    l1: euro(config.commissionL1Cents),
    l2: euro(config.commissionL2Cents),
    l3: euro(config.commissionL3Cents),
    l4: euro(config.commissionL4Cents),
    l5: euro(config.commissionL5Cents),
    maxCommissionPercent: String(config.maxCommissionPercent),
    maturationDays: String(config.commissionMaturationDays),
    fallbackDays: String(config.commissionFallbackDays),
    minPayout: euro(config.minPayoutCents),
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Anteprima live: rende leggibile l'impatto del piano prima di salvarlo.
  const planCents = toCents(form.l1) + toCents(form.l2) + toCents(form.l3)
    + toCents(form.l4) + toCents(form.l5);
  const referenceCents = 5000; // ordine tipo da 50€
  const planPercent = Math.round((planCents / referenceCents) * 1000) / 10;
  const overCap = planPercent > (parseInt(form.maxCommissionPercent) || 0);

  const save = () =>
    startTransition(async () => {
      await updateStoreConfig({
        flatShippingCents: toCents(form.flatShipping),
        freeShippingThreshold: toCents(form.freeShipping),
        commissionL1Cents: toCents(form.l1),
        commissionL2Cents: toCents(form.l2),
        commissionL3Cents: toCents(form.l3),
        commissionL4Cents: toCents(form.l4),
        commissionL5Cents: toCents(form.l5),
        maxCommissionPercent: parseInt(form.maxCommissionPercent) || 0,
        commissionMaturationDays: parseInt(form.maturationDays) || 0,
        commissionFallbackDays: parseInt(form.fallbackDays) || 0,
        minPayoutCents: toCents(form.minPayout),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });

  return (
    <div className="mt-6 max-w-lg space-y-6">
      <section className="space-y-4 rounded-2xl border border-coffee-100 bg-white p-6">
        <h2 className="font-semibold text-coffee-900">Spedizione</h2>
        <Field label="Costo spedizione (€)">
          <Input value={form.flatShipping} onChange={set("flatShipping")} />
        </Field>
        <Field label="Soglia spedizione gratuita (€)">
          <Input value={form.freeShipping} onChange={set("freeShipping")} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-coffee-100 bg-white p-6">
        <div>
          <h2 className="font-semibold text-coffee-900">Piano provvigionale</h2>
          <p className="mt-1 text-sm text-coffee-600">
            Importo fisso per confezione acquistata, riconosciuto risalendo l&apos;albero
            degli sponsor.
          </p>
        </div>

        {([1, 2, 3, 4, 5] as const).map((n) => (
          <Field key={n} label={`Livello ${n} — € per confezione`}>
            <Input
              value={form[`l${n}` as const]}
              onChange={set(`l${n}` as keyof typeof form)}
            />
          </Field>
        ))}

        <div className="rounded-xl bg-coffee-50 p-3 text-sm text-coffee-700">
          Su un ordine da <strong>{formatEuro(referenceCents)}</strong> distribuisci{" "}
          <strong>{formatEuro(planCents)}</strong> ({planPercent}%).
          {overCap && (
            <span className="mt-1 block text-red-700">
              Attenzione: il piano supera il tetto del {form.maxCommissionPercent}%, quindi
              gli importi verranno scalati in proporzione.
            </span>
          )}
        </div>

        <Field label="Tetto massimo provvigioni (% del netto ordine)">
          <Input value={form.maxCommissionPercent} onChange={set("maxCommissionPercent")} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-coffee-100 bg-white p-6">
        <h2 className="font-semibold text-coffee-900">Maturazione e prelievi</h2>
        <Field label="Giorni dalla consegna prima che la provvigione sia prelevabile">
          <Input value={form.maturationDays} onChange={set("maturationDays")} />
        </Field>
        <Field label="Giorni dal pagamento oltre i quali matura comunque (se l'ordine non viene mai segnato consegnato)">
          <Input value={form.fallbackDays} onChange={set("fallbackDays")} />
        </Field>
        <Field label="Importo minimo prelevabile (€)">
          <Input value={form.minPayout} onChange={set("minPayout")} />
        </Field>
      </section>

      <Button onClick={save} disabled={pending} size="lg">
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : saved ? (
          <>
            <Check className="h-5 w-5" /> Salvato
          </>
        ) : (
          "Salva impostazioni"
        )}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
