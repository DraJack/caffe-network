// Estrazioni dai dati di catalogo per la pagina prodotto.
//
// Tutto si ricava da campi che esistono già (nome prodotto, nome variante, origin):
// niente colonne nuove da tenere allineate. Ogni funzione restituisce null se il
// dato non ha la forma attesa, e la UI corrispondente semplicemente non compare —
// un nome scritto a mano in Prisma Studio non deve mai rompere la pagina.

/** Plurale (come scritto nel nome variante) → singolare per "0,47 € a cialda". */
const UNIT_SINGULAR: Record<string, string> = {
  cialde: "cialda",
  capsule: "capsula",
};

export type Pack = { count: number; unit: string; unitPlural: string };

/** "150 cialde" → { count: 150, unit: "cialda", unitPlural: "cialde" }. */
export function parsePack(variantName: string): Pack | null {
  const m = variantName.trim().match(/^(\d+)\s+(\p{L}+)/u);
  if (!m) return null;
  const count = Number(m[1]);
  const unitPlural = m[2].toLowerCase();
  const unit = UNIT_SINGULAR[unitPlural];
  if (!count || !unit) return null;
  return { count, unit, unitPlural };
}

/** Prezzo a pezzo in centesimi, arrotondato: 7000 / 150 → 47. */
export function unitPriceCents(priceCents: number, pack: Pack): number {
  return Math.round(priceCents / pack.count);
}

/**
 * Etichetta breve della macchina compatibile, presa dal nome prodotto:
 * "Gran Crema — Capsule compatibili Nespresso®" → "Nespresso®".
 * Senza "compatibili" si toglie solo il nome della miscela prima del trattino.
 */
export function machineLabel(productName: string): string {
  const after = productName.split(/\bcompatibili\s+/i)[1];
  if (after) return after.trim();
  return productName.replace(/^.*?—\s*/, "").trim() || productName;
}

/** "Gran Crema — Cialde compatibili …" → "Gran Crema". Senza trattino: null. */
export function blendName(productName: string): string | null {
  if (!productName.includes("—")) return null;
  return productName.split("—")[0].trim() || null;
}

export type BlendPart = { percent: number; name: string };

/**
 * "Miscela\n70% Robusta\n30% Arabica" → [{70, Robusta}, {30, Arabica}].
 * Valida solo se le percentuali sommano a 100: altrimenti la barra mentirebbe.
 */
export function parseBlend(origin: string | null | undefined): BlendPart[] | null {
  if (!origin) return null;
  const parts = origin.split("\n").flatMap((line) => {
    const m = line.trim().match(/^(\d{1,3})\s*%\s*(.+)$/);
    return m ? [{ percent: Number(m[1]), name: m[2].trim() }] : [];
  });
  const total = parts.reduce((s, p) => s + p.percent, 0);
  return parts.length > 0 && total === 100 ? parts : null;
}

export const ROAST_STEPS = [
  { value: "LIGHT", label: "Chiara" },
  { value: "MEDIUM", label: "Media" },
  { value: "DARK", label: "Scura" },
] as const;
