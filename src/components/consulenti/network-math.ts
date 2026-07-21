// Matematica del simulatore di rete mostrato in /consulenti.
//
// Modello volutamente semplice e dichiarato in pagina: rete UNIFORME (ognuno
// invita esattamente `perPerson` persone) e 1 confezione provvigionabile al mese
// a testa. Serve a far capire la forma del piano, non a prevedere il futuro.
//
// ⚠️ `maxCommissionPercent` NON entra qui: è un tetto per-ordine sul netto
// dell'ordine, non sul totale mensile di una rete. Applicarlo sarebbe sbagliato.
//
// Nessun import: funzione pura, come src/lib/commissions.ts.

/** Oltre questa soglia una riga non è più disegnabile nodo per nodo. */
export const MAX_NODES_PER_ROW = 24;

export const MIN_PER_PERSON = 1;
export const MAX_PER_PERSON = 6;

export type LevelRow = {
  level: number;
  /** Persone reali a questo livello: perPerson^level. */
  people: number;
  /** Quante ne disegniamo davvero (≤ MAX_NODES_PER_ROW). */
  shown: number;
  /** Quante restano fuori dal disegno: people - shown. */
  hidden: number;
  rateCents: number;
  amountCents: number;
  /** Falso per i livelli oltre la profondità scelta: mostrati ma spenti. */
  active: boolean;
};

export type NetworkResult = {
  /** Sempre tutti i livelli del piano, anche quelli spenti. */
  rows: LevelRow[];
  totalCents: number;
  totalPeople: number;
};

/**
 * Costruisce la rete teorica.
 *
 * `ratesCents` è indicizzato da 0 (= livello 1): arriva dal server, calcolato
 * con `levelRateCents()` su StoreConfig. Qui non esistono tariffe hardcoded.
 */
export function buildNetwork(
  perPerson: number,
  depth: number,
  ratesCents: number[],
): NetworkResult {
  const rows: LevelRow[] = [];
  let totalCents = 0;
  let totalPeople = 0;

  for (let level = 1; level <= ratesCents.length; level++) {
    const people = Math.pow(perPerson, level);
    const rateCents = ratesCents[level - 1] ?? 0;
    const amountCents = people * rateCents;
    const active = level <= depth;
    const shown = Math.min(people, MAX_NODES_PER_ROW);

    rows.push({
      level,
      people,
      shown,
      hidden: people - shown,
      rateCents,
      amountCents,
      active,
    });

    if (active) {
      totalCents += amountCents;
      totalPeople += people;
    }
  }

  return { rows, totalCents, totalPeople };
}

/** Formattazione italiana dei conteggi (9330 → "9.330"). */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("it-IT").format(n);
}
