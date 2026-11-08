import { Suspense } from "react";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCart } from "@/server/cart";
import { BrandWordmark } from "@/components/brand-logo";
import { MainNav, MobileNav } from "@/components/main-nav";

export async function SiteHeader() {
  const session = await auth();
  const cart = await getCart();

  return (
    <header className="sticky top-0 z-40 border-b border-accent/20 bg-coffee-950">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="AS Life, vai alla home"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <BrandWordmark />
        </Link>

        {/* useSearchParams richiede un confine Suspense in prerendering */}
        <Suspense fallback={<div className="hidden md:block" />}>
          <MainNav />
        </Suspense>

        <div className="flex items-center gap-1">
          <Link
            href={session ? "/account" : "/login"}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-coffee-200 transition-colors hover:bg-coffee-800 hover:text-cream"
          >
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">{session ? "Account" : "Accedi"}</span>
          </Link>

          <Link
            href="/carrello"
            aria-label={`Carrello${cart.count > 0 ? `, ${cart.count} articoli` : " vuoto"}`}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-coffee-200 transition-colors hover:bg-coffee-800 hover:text-cream"
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
