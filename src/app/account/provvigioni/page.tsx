import Link from "next/link";
import { ArrowLeft, Coins, Receipt } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatEuro, cn } from "@/lib/utils";
import { getStoreConfig } from "@/lib/config";
import { commissionStatus } from "@/lib/order-status";
import { getOrCreateCommissionAccount } from "@/server/commissions";
import { PayoutForm } from "@/components/account/payout-form";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Le mie provvigioni" };

const PAYOUT_LABEL: Record<string, string> = {
  REQUESTED: "In lavorazione",
  PAID: "Pagata",
  REJECTED: "Rifiutata",
};

export default async function CommissionsPage() {
  const sessionUser = await requireUser();
  const account = await getOrCreateCommissionAccount(sessionUser.id);

  const [byLevel, ledger, payouts, openRequest, config] = await Promise.all([
    prisma.commission.groupBy({
      by: ["level"],
      where: { accountId: account.id, status: { in: ["APPROVED", "PAID"] } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.commission.findMany({
      where: { accountId: account.id },
      include: { order: { select: { number: true } }, buyer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.payoutRequest.findMany({
      where: { accountId: account.id },
      orderBy: { requestedAt: "desc" },
      take: 10,
    }),
    prisma.payoutRequest.findFirst({
      where: { accountId: account.id, status: "REQUESTED" },
      select: { id: true },
    }),
    getStoreConfig(),
  ]);

  const maxLevelSum = Math.max(1, ...byLevel.map((r) => r._sum.amountCents ?? 0));

  return (
    <div className="container-page py-10">
      <Link
        href="/account"
        className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-coffee-600 transition-colors hover:text-coffee-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Torna all&apos;account
      </Link>

      <h1 className="font-heading text-4xl font-bold tracking-tight text-coffee-900">
        Le mie provvigioni
      </h1>
      <p className="mt-2 max-w-2xl text-coffee-600">
        Maturano su ogni acquisto della tua rete e diventano prelevabili{" "}
        {config.commissionMaturationDays} giorni dopo la consegna.
      </p>

      {/* Saldi */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="In maturazione" value={account.pendingCents} hint="Non ancora prelevabile" />
        <Stat label="Disponibile" value={account.availableCents} hint="Pronto al prelievo" highlight />
        <Stat label="In lavorazione" value={account.requestedCents} hint="Prelievo richiesto" />
        <Stat label="Già incassato" value={account.paidCents} hint="Bonifici ricevuti" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div>
          <h2 className="font-heading text-2xl font-bold text-coffee-900">Guadagni per livello</h2>
          {byLevel.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={<Coins className="h-7 w-7" />}
              title="Nessuna provvigione maturata"
              description="Quando qualcuno della tua rete acquisterà, qui vedrai il guadagno diviso per livello."
              action={{ label: "Condividi il tuo link", href: "/account/rete" }}
            />
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-card)">
              <table className="w-full text-sm">
                <thead className="bg-coffee-50 text-left text-coffee-600">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Livello</th>
                    <th className="px-5 py-3.5 font-medium">Provvigioni</th>
                    <th className="px-5 py-3.5 text-right font-medium">Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-100">
                  {byLevel
                    .sort((a, b) => a.level - b.level)
                    .map((r) => {
                      const sum = r._sum.amountCents ?? 0;
                      return (
                        <tr key={r.level} className="transition-colors hover:bg-coffee-50/60">
                          <td className="px-5 py-3.5">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-coffee-100 px-1.5 text-xs font-semibold text-coffee-700">
                              L{r.level}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-coffee-600">{r._count}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-3">
                              <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-coffee-100 sm:block">
                                <div
                                  className="h-full rounded-full bg-accent"
                                  style={{ width: `${(sum / maxLevelSum) * 100}%` }}
                                />
                              </div>
                              <span className="font-heading font-semibold tabular-nums text-coffee-900">
                                {formatEuro(sum)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mt-12 font-heading text-2xl font-bold text-coffee-900">Movimenti</h2>
          {ledger.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={<Receipt className="h-7 w-7" />}
              title="Nessun movimento"
              description="Il registro delle provvigioni è ancora vuoto."
            />
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-card)">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-coffee-50 text-left text-coffee-600">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Data</th>
                    <th className="px-5 py-3.5 font-medium">Origine</th>
                    <th className="px-5 py-3.5 font-medium">Stato</th>
                    <th className="px-5 py-3.5 text-right font-medium">Importo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-100">
                  {ledger.map((c) => {
                    const status = commissionStatus(c.status);
                    const reversed = c.status === "REVERSED";
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-coffee-50/60">
                        <td className="px-5 py-3.5 whitespace-nowrap text-coffee-600">
                          {c.createdAt.toLocaleDateString("it-IT")}
                        </td>
                        <td className="px-5 py-3.5 text-coffee-700">
                          {c.order ? `Ordine #${c.order.number}` : "Rettifica"}
                          {c.buyer?.name && ` · ${c.buyer.name}`}
                          <span className="ml-1.5 text-coffee-400">L{c.level}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3.5 text-right font-heading font-semibold tabular-nums",
                            reversed ? "text-red-600 line-through" : "text-emerald-700",
                          )}
                        >
                          {formatEuro(c.amountCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Prelievo */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <PayoutForm
            availableCents={account.availableCents}
            minPayoutCents={config.minPayoutCents}
            hasOpenRequest={!!openRequest}
          />

          {payouts.length > 0 && (
            <div className="rounded-2xl border border-coffee-100 bg-white p-5 shadow-(--shadow-card)">
              <h3 className="font-heading font-semibold text-coffee-900">Storico prelievi</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="text-coffee-600">
                      {p.requestedAt.toLocaleDateString("it-IT")}
                      <span
                        className={cn(
                          "ml-2",
                          p.status === "PAID" && "text-emerald-700",
                          p.status === "REJECTED" && "text-red-600",
                        )}
                      >
                        {PAYOUT_LABEL[p.status] ?? p.status}
                      </span>
                    </span>
                    <span className="font-medium tabular-nums text-coffee-900">
                      {formatEuro(p.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Reveal>
      <div
        className={cn(
          "h-full rounded-2xl border p-5 transition-shadow duration-300",
          highlight
            ? "border-accent bg-accent/10 shadow-(--shadow-card)"
            : "border-coffee-100 bg-white shadow-(--shadow-soft)",
        )}
      >
        <p className="text-sm text-coffee-500">{label}</p>
        <p
          className={cn(
            "mt-1.5 font-heading text-3xl font-bold tabular-nums",
            highlight ? "text-accent-dark" : "text-coffee-900",
          )}
        >
          {formatEuro(value)}
        </p>
        {hint && <p className="mt-1 text-xs text-coffee-500">{hint}</p>}
      </div>
    </Reveal>
  );
}
