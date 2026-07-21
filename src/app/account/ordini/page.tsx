import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { orderStatus } from "@/lib/order-status";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "I miei ordini" };

export default async function OrdersPage() {
  const sessionUser = await requireUser();

  const orders = await prisma.order.findMany({
    where: { userId: sessionUser.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

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
        I miei ordini
      </h1>

      {orders.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Package className="h-7 w-7" />}
          title="Non hai ancora ordini"
          description="Qui troverai lo storico completo dei tuoi acquisti e lo stato di ogni spedizione."
          action={{ label: "Scopri il catalogo", href: "/catalogo" }}
        />
      ) : (
        <div className="mt-7 space-y-4">
          {orders.map((o, i) => {
            const status = orderStatus(o.status);
            return (
              <Reveal key={o.id} delay={Math.min(i, 5) * 60}>
                <div className="rounded-2xl border border-coffee-100 bg-white p-6 shadow-(--shadow-card) transition-shadow duration-300 hover:shadow-(--shadow-lift)">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-heading text-lg font-semibold text-coffee-900">
                        Ordine #{o.number}
                      </span>
                      <span className="ml-3 text-sm text-coffee-500">
                        {o.createdAt.toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <ul className="mt-4 divide-y divide-coffee-50 text-sm">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-3 py-2">
                        <span className="text-coffee-700">
                          {it.name} <span className="text-coffee-400">× {it.quantity}</span>
                        </span>
                        <span className="shrink-0 text-coffee-900">
                          {formatEuro(it.priceCents * it.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-coffee-100 pt-3 text-sm">
                    <span className="text-coffee-600">
                      {o.discountCents > 0 && (
                        <span className="text-emerald-700">
                          Sconto −{formatEuro(o.discountCents)} ·{" "}
                        </span>
                      )}
                      Spedizione {o.shippingCents === 0 ? "gratuita" : formatEuro(o.shippingCents)}
                    </span>
                    <span className="font-heading text-lg font-bold text-coffee-900">
                      {formatEuro(o.totalCents)}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
