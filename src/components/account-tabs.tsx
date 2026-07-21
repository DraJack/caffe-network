"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS: [string, string][] = [
  ["Panoramica", "/account"],
  ["Ordini", "/account/ordini"],
  ["La mia rete", "/account/rete"],
  ["Vetrina", "/account/vetrina"],
  ["Provvigioni", "/account/provvigioni"],
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-coffee-100 bg-white">
      <div className="container-page flex gap-1 overflow-x-auto py-3">
        {TABS.map(([label, href]) => {
          // "/account" combacia solo esattamente, altrimenti sarebbe sempre attivo.
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-coffee-800 text-cream shadow-(--shadow-soft)"
                  : "text-coffee-600 hover:bg-coffee-50 hover:text-coffee-900",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
