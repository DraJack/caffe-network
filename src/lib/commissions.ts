// Logica di calcolo del piano provvigionale unilevel (Fase 2).
//
// Importo FISSO in centesimi per confezione provvigionabile, non percentuale:
// su un ordine da 50€ (1 unità) escono 10€ / 2€ / 2€ / 2€ / 3€ = 19€ (38%).
// Scala col volume: 3 confezioni ⇒ 30/6/6/6/9€.
//
// Nessun accesso al DB e nessun import: la funzione è pura, quindi è testabile
// e riusabile dal seed (che non può importare moduli marcati "server-only").

export const COMMISSION_DEPTH = 5;

export const MS_PER_DAY = 86_400_000;

/** Tipo strutturale: StoreConfig lo soddisfa direttamente. */
export type CommissionRules = {
  commissionL1Cents: number;
  commissionL2Cents: number;
  commissionL3Cents: number;
  commissionL4Cents: number;
  commissionL5Cents: number;
  maxCommissionPercent: number;
};

export function levelRateCents(level: number, rules: CommissionRules): number {
  switch (level) {
    case 1:
      return rules.commissionL1Cents;
    case 2:
      return rules.commissionL2Cents;
    case 3:
      return rules.commissionL3Cents;
    case 4:
      return rules.commissionL4Cents;
    case 5:
      return rules.commissionL5Cents;
    default:
      return 0;
  }
}

/** Unità provvigionabili totali di un ordine (le varianti a 0 non contano). */
export function commissionableUnits(
  items: { commissionUnits: number; quantity: number }[],
): number {
  return items.reduce((sum, it) => sum + Math.max(0, it.commissionUnits) * it.quantity, 0);
}

export type CommissionSplit = {
  level: number;
  units: number;
  rateCents: number;
  amountCents: number;
};

/**
 * Ripartizione della provvigione per livello.
 *
 * `levels` sono i livelli REALMENTE popolati nell'upline: una catena più corta
 * di 5 produce semplicemente meno righe (es. [1, 2, 3]).
 *
 * Il tetto `maxCommissionPercent` è una rete di sicurezza sul margine: se un
 * giorno tornassero sconti o coupon, un ordine fortemente scontato non potrà
 * mai distribuire più di quella % dell'incassato. Con il listino attuale (nessuno
 * sconto attivo) non scatta mai.
 *
 * Invariante: sum(amountCents) === min(gross, cap), sempre.
 */
export function computeCommissionSplit(params: {
  units: number;
  basisCents: number; // subtotalCents - discountCents
  levels: number[];
  rules: CommissionRules;
}): CommissionSplit[] {
  const { units, basisCents, levels, rules } = params;
  if (units <= 0 || basisCents <= 0 || levels.length === 0) return [];

  const rows: CommissionSplit[] = [...levels]
    .sort((a, b) => a - b)
    .map((level) => {
      const rateCents = levelRateCents(level, rules);
      return { level, units, rateCents, amountCents: units * rateCents };
    });

  const gross = rows.reduce((s, r) => s + r.amountCents, 0);
  if (gross <= 0) return [];

  const capCents = Math.floor((basisCents * rules.maxCommissionPercent) / 100);
  if (capCents <= 0) return [];
  if (gross <= capCents) return rows.filter((r) => r.amountCents > 0);

  // Oltre il tetto: scala proporzionalmente in centesimi interi…
  const scaled = rows.map((r) => ({
    ...r,
    amountCents: Math.floor((r.amountCents * capCents) / gross),
  }));
  // …poi ridistribuisce i centesimi persi nell'arrotondamento, dal livello 1 in giù.
  // Il residuo è sempre < numero di livelli, quindi un solo giro basta.
  let remainder = capCents - scaled.reduce((s, r) => s + r.amountCents, 0);
  for (let i = 0; i < scaled.length && remainder > 0; i++) {
    scaled[i].amountCents += 1;
    remainder -= 1;
  }
  return scaled.filter((r) => r.amountCents > 0);
}

/** Totale distribuito da un ordine "tipo" — usato per l'anteprima in admin. */
export function planTotalCents(rules: CommissionRules): number {
  return (
    rules.commissionL1Cents +
    rules.commissionL2Cents +
    rules.commissionL3Cents +
    rules.commissionL4Cents +
    rules.commissionL5Cents
  );
}
