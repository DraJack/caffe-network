import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export const metadata = { title: "Admin · Ordini" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-coffee-900">Ordini</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-coffee-600">Nessun ordine.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-coffee-100 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-coffee-50 text-left text-coffee-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Articoli</th>
                <th className="px-4 py-3 text-right">Totale</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-coffee-900">{o.number}</td>
                  <td className="px-4 py-3 text-coffee-600">
                    {o.createdAt.toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-coffee-700">{o.user?.name ?? o.email}</td>
                  <td className="px-4 py-3 text-coffee-600">
                    {o.items.reduce((s, it) => s + it.quantity, 0)} pz
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatEuro(o.totalCents)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect orderId={o.id} value={o.status} />
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
