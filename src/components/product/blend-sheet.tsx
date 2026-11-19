import { ROAST_STEPS, type BlendPart } from "@/lib/product";
import { cn } from "@/lib/utils";

type Props = {
  /** Nome della miscela (la parte del nome prodotto prima del trattino), es. "Gran Crema". */
  blendName: string | null;
  blend: BlendPart[] | null;
  roast: string | null | undefined;
  specs: { label: string; value: string }[];
};

/** Segmenti della barra di composizione: caffè scuro, poi oro. */
const BLEND_COLORS = ["bg-coffee-900", "bg-accent", "bg-accent-dark", "bg-coffee-400"];

/**
 * Scheda tecnica della miscela, sotto foto e rassicurazioni: tipografia piccola,
 * filetti sottili, come l'etichetta di un prodotto premium. Solo dati veri del
 * catalogo: nessuna "intensità" inventata.
 */
export function BlendSheet({ blendName, blend, roast, specs }: Props) {
  const roastIndex = ROAST_STEPS.findIndex((s) => s.value === roast);
  if (!blend && roastIndex < 0 && specs.length === 0) return null;

  return (
    <section
      aria-labelledby="scheda-miscela"
      className="rounded-2xl border border-coffee-100 bg-white px-5 py-5 shadow-(--shadow-soft) sm:px-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p id="scheda-miscela" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-dark">
          La miscela
        </p>
        {blendName && <p className="font-heading text-lg font-bold text-coffee-900">{blendName}</p>}
      </div>

      {blend && (
        <div className="mt-5">
          <div className="flex justify-between gap-4 text-sm">
            {blend.map((p) => (
              <span key={p.name} className="text-coffee-600 last:text-right">
                <span className="font-heading text-lg font-bold text-coffee-900">{p.percent}%</span>{" "}
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
                className={cn("h-full", BLEND_COLORS[i % BLEND_COLORS.length])}
                style={{ width: `${p.percent}%` }}
              />
            ))}
          </div>
        </div>
      )}

      <dl className="mt-5 divide-y divide-coffee-100 border-t border-coffee-100 text-sm">
        {roastIndex >= 0 && (
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-coffee-500">
              Tostatura
            </dt>
            <dd className="flex items-center gap-3 text-coffee-900">
              <span className="flex gap-1" aria-hidden>
                {ROAST_STEPS.map((s, i) => (
                  <span
                    key={s.value}
                    className={cn(
                      "h-1.5 w-4 rounded-full",
                      i <= roastIndex ? "bg-coffee-900" : "bg-coffee-200",
                    )}
                  />
                ))}
              </span>
              {ROAST_STEPS[roastIndex].label}
            </dd>
          </div>
        )}
        {specs.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-coffee-500">
              {s.label}
            </dt>
            <dd className="text-right text-coffee-900">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
