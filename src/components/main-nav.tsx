"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_LINKS: [string, string][] = [
  ["Catalogo", "/catalogo"],
  ["Espresso", "/catalogo?categoria=espresso"],
  ["Filtro", "/catalogo?categoria=filtro"],
  ["Diventa consulente", "/consulenti"],
];

/** Un link è attivo se combaciano sia il path sia il parametro `categoria`. */
function useIsActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoria = searchParams.get("categoria");

  return React.useCallback(
    (href: string) => {
      const [path, query] = href.split("?");
      if (pathname !== path) return false;
      const target = query ? new URLSearchParams(query).get("categoria") : null;
      return target === categoria;
    },
    [pathname, categoria],
  );
}

/** Navigazione desktop, con indicatore della voce attiva. */
export function MainNav() {
  const isActive = useIsActive();

  return (
    <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
      {NAV_LINKS.map(([label, href]) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-full px-3 py-2 transition-colors duration-200",
              active ? "text-coffee-900" : "text-coffee-600 hover:text-coffee-900",
            )}
          >
            {label}
            <span
              className={cn(
                "absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent transition-transform duration-300 ease-out-quart",
                active ? "scale-x-100" : "scale-x-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

/** Menu mobile: sotto md la navigazione altrimenti sparirebbe del tutto. */
export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = React.useState(false);
  const isActive = useIsActive();

  // Il drawer si chiude sul click dei link (close() qui sotto) anziché in un
  // effect sul pathname: evita un render in cascata a ogni navigazione.
  const close = () => setOpen(false);

  // Blocca lo scroll del body e chiude con Esc mentre il drawer è aperto.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Apri il menu"
        aria-expanded={open}
        className="rounded-full p-2 text-coffee-700 transition-colors hover:bg-coffee-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 animate-fade-in bg-coffee-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Chiudi il menu"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] animate-slide-in-right flex-col bg-cream shadow-(--shadow-hero)">
            <div className="flex h-16 items-center justify-between border-b border-coffee-100 px-4">
              <span className="font-heading text-lg font-semibold text-coffee-900">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Chiudi il menu"
                className="rounded-full p-2 text-coffee-700 transition-colors hover:bg-coffee-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map(([label, href]) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-coffee-800 text-cream"
                        : "text-coffee-800 hover:bg-coffee-100",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="my-3 border-t border-coffee-100" />

              <Link
                href={isLoggedIn ? "/account" : "/login"}
                onClick={close}
                className="rounded-xl px-4 py-3 text-base font-medium text-coffee-800 transition-colors hover:bg-coffee-100"
              >
                {isLoggedIn ? "Il tuo account" : "Accedi"}
              </Link>
              <Link
                href="/carrello"
                onClick={close}
                className="rounded-xl px-4 py-3 text-base font-medium text-coffee-800 transition-colors hover:bg-coffee-100"
              >
                Carrello
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
