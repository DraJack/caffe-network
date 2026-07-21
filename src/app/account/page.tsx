import Link from "next/link";
import { Coins, Package, Users, Shield, ArrowRight, ShoppingBag } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { orderStatus } from "@/lib/order-status";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Il mio account" };

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: {
      commissionAccount: true,
      orders: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { referrals: true } },
    },
  });

  const account = user.commissionAccount;
  const earnedCents =
    (account?.availableCents ?? 0) + (account?.requestedCents ?? 0) + (account?.paidCents ?? 0);

  const stats = [
    {
      icon: <Coins className="h-4 w-4" />,
      label: "Provvigioni",
      value: formatEuro(earnedCents),
      href: "/account/provvigioni",
      cta: "Dettaglio e prelievi",
      highlight: true,
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: "Ordini",
      value: String(user.orders.length),
      href: "/account/ordini",
      cta: "Storico ordini",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "La tua rete",
      value: String(user._count.referrals),
      href: "/account/rete",
      cta: "Vedi i 5 livelli",
    },
  ];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-coffee-900">
            Ciao, {user.name ?? "utente"} 👋
          </h1>
          <p className="mt-1 text-coffee-600">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 80}>
            <Card variant="elevated" className="group h-full">
              <CardBody className="flex h-full flex-col">
                <div className="flex items-center gap-2 text-sm text-coffee-500">
                  <span className={s.highlight ? "text-accent-dark" : ""}>{s.icon}</span>
                  {s.label}
                </div>
                <p className="mt-3 font-heading text-4xl font-bold tabular-nums text-coffee-900">
                  {s.value}
                </p>
                <Link
                  href={s.href}
                  className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent-dark transition-colors hover:text-accent"
                >
                  {s.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </CardBody>
            </Card>
          </Reveal>
        ))}
      </div>

      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="mt-6 flex items-center gap-2 rounded-xl border border-coffee-200 bg-white px-4 py-3 text-sm font-medium text-coffee-800 shadow-(--shadow-soft) transition-all hover:-translate-y-0.5 hover:bg-coffee-50 hover:shadow-(--shadow-card)"
        >
          <Shield className="h-4 w-4 text-accent-dark" /> Vai al pannello admin
          <ArrowRight className="ml-auto h-4 w-4" />
        </Link>
      )}

      <div className="mt-12 flex items-end justify-between gap-4">
        <h2 className="font-heading text-2xl font-bold text-coffee-900">Ordini recenti</h2>
        {user.orders.length > 0 && (
          <Link
            href="/account/ordini"
            className="text-sm font-medium text-accent-dark transition-colors hover:text-accent"
          >
            Vedi tutti
          </Link>
        )}
      </div>

      {user.orders.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Non hai ancora effettuato ordini"
          description="Quando acquisterai, qui troverai lo stato di ogni spedizione."
          action={{ label: "Scopri il catalogo", href: "/catalogo" }}
        />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-coffee-100 bg-white shadow-(--shadow-card)">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-coffee-50 text-left text-coffee-600">
              <tr>
                <th className="px-5 py-3.5 font-medium">Ordine</th>
                <th className="px-5 py-3.5 font-medium">Data</th>
                <th className="px-5 py-3.5 font-medium">Stato</th>
                <th className="px-5 py-3.5 text-right font-medium">Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {user.orders.map((o) => {
                const status = orderStatus(o.status);
                return (
                  <tr key={o.id} className="transition-colors hover:bg-coffee-50/60">
                    <td className="px-5 py-3.5 font-medium text-coffee-900">#{o.number}</td>
                    <td className="px-5 py-3.5 text-coffee-600">
                      {o.createdAt.toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                      {formatEuro(o.totalCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
