import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { PayoutActions } from "@/components/admin/payout-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Pagamenti" };

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Da pagare",
  PAID: "Pagata",
  REJECTED: "Rifiutata",
};

export default async function AdminPayoutsPage() {
  const payouts = await prisma.payoutRequest.findMany({
    include: { account: { select: { user: { select: { name: true, email: true } } } } },
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
    take: 100,
  });

  const pendingTotal = payouts
    .filter((p) => p.status === "REQUESTED")
    .reduce((s, p) => s + p.amountCents, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-coffee-900">Pagamenti provvigioni</h1>
      <p className="mt-1 text-coffee-600">
        Da liquidare: <strong>{formatEuro(pendingTotal)}</strong>. Esegui il bonifico, poi
        segna la richiesta come pagata.
      </p>

      {payouts.length === 0 ? (
        <p className="mt-4 text-coffee-600">Nessuna richiesta di pagamento.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-coffee-100 bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-coffee-50 text-left text-coffee-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Consulente</th>
                <th className="px-4 py-3">Intestatario</th>
                <th className="px-4 py-3">IBAN</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Importo</th>
                <th className="px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-coffee-600">
                    {p.requestedAt.toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-coffee-900">
                    {p.account.user.name ?? p.account.user.email}
                  </td>
                  <td className="px-4 py-3 text-coffee-700">{p.holderName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-coffee-600">{p.iban}</td>
                  <td className="px-4 py-3 text-coffee-600">{STATUS_LABEL[p.status]}</td>
                  <td className="px-4 py-3 text-right font-semibold text-coffee-900">
                    {formatEuro(p.amountCents)}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "REQUESTED" ? <PayoutActions payoutId={p.id} /> : "—"}
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
