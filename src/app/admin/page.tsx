import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Admin · Dashboard" };

export default async function AdminDashboard() {
  const [orderCount, paidAgg, productCount, userCount, pending] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    }),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-coffee-900">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Fatturato (pagato)" value={formatEuro(paidAgg._sum.totalCents ?? 0)} />
        <Stat label="Ordini totali" value={String(orderCount)} />
        <Stat label="Ordini in attesa" value={String(pending)} />
        <Stat label="Prodotti" value={String(productCount)} />
        <Stat label="Utenti" value={String(userCount)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-coffee-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-coffee-900">{value}</p>
      </CardBody>
    </Card>
  );
}
