import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store,
  Coins,
  Banknote,
} from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/prodotti", label: "Prodotti", icon: Package },
  { href: "/admin/ordini", label: "Ordini", icon: ShoppingCart },
  { href: "/admin/utenti", label: "Utenti", icon: Users },
  { href: "/admin/provvigioni", label: "Provvigioni", icon: Coins },
  { href: "/admin/payout", label: "Pagamenti", icon: Banknote },
  { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="container-page grid gap-8 py-8 md:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-coffee-100 bg-white p-3">
        <div className="px-3 py-2 text-sm font-semibold text-coffee-900">Admin</div>
        <nav className="mt-1 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-coffee-700 hover:bg-coffee-100"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 border-t border-coffee-100 p-3">
          <Link
            href="/"
            className="mb-2 flex items-center gap-2 text-sm text-coffee-600 hover:text-coffee-900"
          >
            <Store className="h-4 w-4" /> Vai al negozio
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
