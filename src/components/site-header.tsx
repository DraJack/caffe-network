import { Suspense } from "react";
import Link from "next/link";
import { Coffee, ShoppingBag, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCart } from "@/server/cart";
import { MainNav, MobileNav } from "@/components/main-nav";

export async function SiteHeader() {
  const session = await auth();
  const cart = await getCart();

  return (
    <header className="sticky top-0 z-40 border-b border-coffee-100/80 bg-cream/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-2 text-coffee-900 transition-opacity hover:opacity-80"
        >
          <Coffee className="h-6 w-6 text-accent transition-transform duration-300 group-hover:-rotate-12" />
          <span className="font-heading text-xl font-semibold tracking-tight">Caffè Network</span>
        </Link>

        {/* useSearchParams richiede un confine Suspense in prerendering */}
        <Suspense fallback={<div className="hidden md:block" />}>
          <MainNav />
        </Suspense>

        <div className="flex items-center gap-1">
          <Link
            href={session ? "/account" : "/login"}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-coffee-700 transition-colors hover:bg-coffee-100 hover:text-coffee-900"
          >
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">{session ? "Account" : "Accedi"}</span>
          </Link>

          <Link
            href="/carrello"
            aria-label={`Carrello${cart.count > 0 ? `, ${cart.count} articoli` : " vuoto"}`}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-coffee-700 transition-colors hover:bg-coffee-100 hover:text-coffee-900"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-coffee-900 shadow-(--shadow-accent)">
                {cart.count}
              </span>
            )}
          </Link>

          <Suspense fallback={null}>
            <MobileNav isLoggedIn={Boolean(session)} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
