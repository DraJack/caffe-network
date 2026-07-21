import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/utils";
import { UserRoleSelect } from "@/components/admin/user-role-select";

export const metadata = { title: "Admin · Utenti" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { commissionAccount: true, _count: { select: { referrals: true, orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-coffee-900">Utenti</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-coffee-100 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-coffee-50 text-left text-coffee-600">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ordini</th>
              <th className="px-4 py-3">Rete</th>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3 text-right">Provvigioni</th>
              <th className="px-4 py-3">Ruolo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-coffee-900">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-coffee-600">{u.email}</td>
                <td className="px-4 py-3 text-coffee-600">{u._count.orders}</td>
                <td className="px-4 py-3 text-coffee-600">{u._count.referrals}</td>
                <td className="px-4 py-3 font-mono text-xs text-coffee-600">{u.referralCode}</td>
                <td className="px-4 py-3 text-right text-coffee-600">
                  {formatEuro(
                    (u.commissionAccount?.pendingCents ?? 0) +
                      (u.commissionAccount?.availableCents ?? 0) +
                      (u.commissionAccount?.requestedCents ?? 0) +
                      (u.commissionAccount?.paidCents ?? 0),
                  )}
                </td>
                <td className="px-4 py-3">
                  <UserRoleSelect userId={u.id} value={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
