import Link from "next/link";
import { Coffee } from "lucide-react";
import { auth } from "@/lib/auth";

export async function SiteFooter() {
  const session = await auth();

  // I link all'area riservata compaiono solo se servono: da sloggato
  // porterebbero a un redirect al login senza spiegazione.
  const community: [string, string][] = session
    ? [
        ["Diventa consulente", "/consulenti"],
        ["Le tue provvigioni", "/account/provvigioni"],
        ["Il tuo account", "/account"],
      ]
    : [
        ["Diventa consulente", "/consulenti"],
        ["Accedi", "/login"],
        ["Registrati", "/registrati"],
      ];

  return (
    <footer className="relative isolate mt-20 overflow-hidden border-t border-coffee-800 bg-coffee-950 text-coffee-100">
      <div className="grain absolute inset-0" aria-hidden />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-cream">
            <Coffee className="h-5 w-5 text-accent" />
            <span className="font-heading text-lg font-semibold">Caffè Network</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-coffee-300">
            Caffè d&apos;eccellenza e una community che cresce insieme.
          </p>
        </div>

        <FooterCol
          title="Negozio"
          links={[
            ["Catalogo", "/catalogo"],
            ["Espresso", "/catalogo?categoria=espresso"],
            ["Filtro", "/catalogo?categoria=filtro"],
            ["Accessori", "/catalogo?categoria=accessori"],
          ]}
        />
        <FooterCol title="Community" links={community} />
        <FooterCol
          title="Info"
          links={[
            ["Chi siamo", "/chi-siamo"],
            ["Spedizioni e resi", "/spedizioni"],
            ["Termini e privacy", "/legal"],
          ]}
        />
      </div>

      <div className="relative border-t border-coffee-800/80">
        <div className="container-page py-4 text-xs text-coffee-400">
          © {new Date().getFullYear()} Caffè Network — MVP dimostrativo. Ambiente di test.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold tracking-wide text-cream">{title}</h4>
      <ul className="space-y-2.5 text-sm text-coffee-300">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-block transition-colors duration-200 hover:text-accent"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
