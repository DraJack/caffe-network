import Link from "next/link";
import { Check } from "lucide-react";
import { PodIcon } from "@/components/product/pod-icons";

export type MachineOption = { slug: string; label: string; group: string; groupPosition: number };

/**
 * "La tua macchina": la miscela è una sola, cambia la compatibilità. Il vero bivio
 * del cliente è quale macchina ha, quindi è il primo passo, prima del prezzo.
 *
 * La scelta corrente è una card in evidenza (nero e oro, come il brand) che dice in
 * chiaro con cosa è compatibile; le alternative sono tile più leggere con la
 * silhouette del formato. Sono link veri: ogni formato ha la sua pagina e il suo URL.
 */
export function MachinePicker({
  options,
  current,
  subtitle,
}: {
  options: MachineOption[];
  current: string;
  /** Riga sotto il nome nella card scelta, es. "Cialde · confezione da 150". */
  subtitle?: string | null;
}) {
  const selected = options.find((o) => o.slug === current);
  const others = options
    .filter((o) => o.slug !== current)
    // Stabile: prima per categoria (cialde, capsule), poi nell'ordine di vetrina.
    .sort((a, b) => a.groupPosition - b.groupPosition);

  return (
    <section aria-labelledby="scegli-macchina">
      <p id="scegli-macchina" className="text-sm font-medium text-coffee-800">
        Scegli la tua macchina
      </p>

      {selected && (
        <div className="mt-3 flex items-center gap-4 rounded-2xl bg-coffee-950 p-4 text-cream shadow-(--shadow-card) ring-1 ring-accent/70">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 text-accent ring-1 ring-accent/25">
            <PodIcon label={selected.label} group={selected.group} className="h-10 w-10" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              Compatibile con
            </p>
            <p className="font-heading text-xl font-bold leading-tight">{selected.label}</p>
            {subtitle && <p className="mt-0.5 text-xs text-coffee-300">{subtitle}</p>}
          </div>
          <span
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-coffee-950"
            aria-label="Selezionata"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </div>
      )}

      {others.length > 0 && (
        <>
          <p className="mt-5 mb-2.5 text-xs text-coffee-500">
            {selected ? "Hai un'altra macchina?" : "Formati disponibili"}
          </p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/prodotto/${o.slug}`}
                  className="group flex h-full flex-col items-center gap-1.5 rounded-2xl border border-coffee-100 bg-white px-1.5 pt-3 pb-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-(--shadow-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <PodIcon
                    label={o.label}
                    group={o.group}
                    className="h-10 w-10 text-coffee-500 transition-colors duration-200 group-hover:text-accent-dark"
                  />
                  <span className="text-xs font-medium leading-tight text-coffee-800">{o.label}</span>
                  <span className="mt-auto text-[10px] uppercase tracking-wider text-coffee-400">
                    {o.group}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
