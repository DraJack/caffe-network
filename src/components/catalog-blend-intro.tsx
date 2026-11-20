import { ROAST_STEPS, blendName, parseBlend } from "@/lib/product";
import { cn } from "@/lib/utils";

type Item = { name: string; origin: string | null; roastLevel: string | null };

/** Segmenti della barra su fondo nero: crema, poi oro. */
const BAR_COLORS = ["bg-cream", "bg-accent", "bg-accent-dark", "bg-coffee-400"];

/**
 * Fascia in cima al catalogo: presenta UNA volta sola la miscela (composizione e
 * tostatura), così le card possono parlare solo di macchina e formato.
 *
 * Tutto ricavato dai dati: compare solo se l'intero catalogo condivide la stessa
 * miscela (nome, composizione, tostatura). Il giorno in cui arriva una seconda
 * miscela la fascia sparisce da sola invece di dire una cosa falsa.
 */
export function CatalogBlendIntro({ products }: { products: Item[] }) {
  if (products.length < 2) return null;

  const [first] = products;
  const name = blendName(first.name);
  const blend = parseBlend(first.origin);
  const shared = products.every(
    (p) =>
      blendName(p.name) === name && p.origin === first.origin && p.roastLevel === first.roastLevel,
  );
  if (!shared || !name || !blend) return null;

  const roast = ROAST_STEPS.find((s) => s.value === first.roastLevel)?.label;

  return (
    <section className="mt-8 grid gap-6 rounded-2xl bg-coffee-950 px-6 py-6 text-cream shadow-(--shadow-card) sm:px-8 md:grid-cols-[1fr_minmax(240px,320px)] md:items-center md:gap-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          La nostra miscela · {products.length} formati
        </p>
        <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-gold">{name}</span>
        </h2>
        {/* Frase di valore, non "è tutto uguale": riprende la descrizione del seed,
            quindi non introduce promesse nuove sul prodotto. */}
        <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/75">
          Carattere spiccato, grande aromaticità e una crema vellutata. Per gustarla a casa, nel
          formato della tua macchina.
        </p>
      </div>

      <div>
        <div className="flex justify-between gap-4 text-sm text-cream/70">
          {blend.map((p) => (
            <span key={p.name} className="last:text-right">
              <span className="font-heading text-lg font-bold text-cream">{p.percent}%</span>{" "}
              {p.name}
            </span>
          ))}
        </div>
        <div
          className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={blend.map((p) => `${p.percent}% ${p.name}`).join(", ")}
        >
          {blend.map((p, i) => (
            <span
              key={p.name}
              className={cn("h-full", BAR_COLORS[i % BAR_COLORS.length])}
              style={{ width: `${p.percent}%` }}
            />
          ))}
        </div>
        {roast && (
          <p className="mt-3 text-xs uppercase tracking-wider text-cream/60">
            Tostatura <span className="font-semibold text-cream">{roast.toLowerCase()}</span>
          </p>
        )}
      </div>
    </section>
  );
}
