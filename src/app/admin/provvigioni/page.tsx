import Link from "next/link";
import type { CommissionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { COMMISSION_DEPTH } from "@/lib/commissions";
import { RecalcButton } from "@/components/admin/recalc-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Provvigioni" };

const STATUSES: CommissionStatus[] = ["PENDING", "APPROVED", "PAID", "REVERSED"];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "In maturazione",
  APPROVED: "Disponibile",
  PAID: "Pagata",
  REVERSED: "Stornata",
};

export default async function AdminCommissionsPage({
  searchParams,
}: {
  // In Next 16 searchParams è una Promise.
  searchParams: Promise<{ stato?: string; livello?: string }>;
}) {
  const { stato, livello } = await searchParams;

  const where: Prisma.CommissionWhereInput = {};
  if (stato && STATUSES.includes(stato as CommissionStatus)) {
    where.status = stato as CommissionStatus;
  }
  const level = Number(livello);
  if (level >= 1 && level <= COMMISSION_DEPTH) where.level = level;

  const [commissions, totals] = await Promise.all([
    prisma.commission.findMany({
      where,
      include: {
        account: { select: { user: { select: { name: true, email: true } } } },
        order: { select: { number: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.commission.groupBy({
      by: ["status"],
      _sum: { amountCents: true },
    }),
  ]);

  const totalBy = (s: string) => totals.find((t) => t.status === s)?._sum.amountCents ?? 0;

  const linkFor = (params: { stato?: string; livello?: string }) => {
    const q = new URLSearchParams();
    if (params.stato) q.set("stato", params.stato);
    if (params.livello) q.set("livello", params.livello);
    const s = q.toString();
    return s ? `/admin/provvigioni?${s}` : "/admin/provvigioni";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-coffee-900">Provvigioni</h1>
        <RecalcButton />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-2xl border border-coffee-100 bg-white p-4">
            <p className="text-sm text-coffee-500">{STATUS_LABEL[s]}</p>
            <p className="mt-1 text-xl font-bold text-coffee-900">{formatEuro(totalBy(s))}</p>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <FilterLink href={linkFor({ livello })} active={!stato}>
          Tutti gli stati
        </FilterLink>
        {STATUSES.map((s) => (
          <FilterLink key={s} href={linkFor({ stato: s, livello })} active={stato === s}>
            {STATUS_LABEL[s]}
          </FilterLink>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <FilterLink href={linkFor({ stato })} active={!livello}>
          Tutti i livelli
        </FilterLink>
        {Array.from({ length: COMMISSION_DEPTH }, (_, i) => i + 1).map((l) => (
          <FilterLink
            key={l}
            href={linkFor({ stato, livello: String(l) })}
            active={livello === String(l)}
          >
            L{l}
          </FilterLink>
        ))}
      </div>

      {commissions.length === 0 ? (
        <p className="mt-4 text-coffee-600">Nessuna provvigione.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-coffee-100 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-coffee-50 text-left text-coffee-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Beneficiario</th>
                <th className="px-4 py-3">Ordine</th>
                <th className="px-4 py-3">Liv.</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Importo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {commissions.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-coffee-600">
                    {c.createdAt.toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-coffee-900">
                    {c.account.user.name ?? c.account.user.email}
                  </td>
                  <td className="px-4 py-3 text-coffee-600">
                    {c.order ? `#${c.order.number}` : "—"}
                    {c.buyer?.name && ` · ${c.buyer.name}`}
                  </td>
                  <td className="px-4 py-3 text-coffee-600">L{c.level}</td>
                  <td className="px-4 py-3 text-coffee-600">{STATUS_LABEL[c.status]}</td>
                  <td className="px-4 py-3 text-right font-medium text-coffee-900">
                    {formatEuro(c.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-coffee-800 px-3 py-1 font-medium text-cream"
          : "rounded-full bg-coffee-50 px-3 py-1 text-coffee-700 hover:bg-coffee-100"
      }
    >
      {children}
    </Link>
  );
}
