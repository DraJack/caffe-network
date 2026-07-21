// Slug del mini-sito consulente: /c/[slug].
// Modulo puro (niente DB, niente "server-only") perché lo importa anche prisma/seed.ts.

// Import relativo e non tramite alias "@/": questo modulo lo importa anche
// prisma/seed.ts, che gira fuori dal bundle Next.
import { slugify } from "./utils";

/**
 * Slug che non possono essere assegnati a un consulente.
 * Le rotte vivono sotto /c/ e non collidono davvero, ma uno slug come "admin"
 * o "checkout" è comunque una trappola per l'utente e un appiglio per il phishing.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // rotte reali di src/app
  "account",
  "actions",
  "admin",
  "api",
  "c",
  "carrello",
  "catalogo",
  "checkout",
  "chi-siamo",
  "consulenti",
  "legal",
  "login",
  "prodotto",
  "registrati",
  "spedizioni",
  // riservati framework / asset
  "_next",
  "static",
  "assets",
  "public",
  "favicon",
  "robots",
  "sitemap",
  "manifest",
  "opengraph-image",
  // spazio per rotte future
  "www",
  "blog",
  "faq",
  "contatti",
  "privacy",
  "cookie",
  "termini",
  "resi",
  "shop",
  "store",
  "help",
  "supporto",
  "formazione",
  "academy",
  "carriera",
]);

/** Formato accettato in URL. Usato come guardia prima di interrogare il DB. */
export const SLUG_PATTERN = /^[a-z0-9-]{2,40}$/;

const MAX_LENGTH = 40;

/** Tronca a MAX_LENGTH senza spezzare una parola a metà. */
function truncateAtHyphen(value: string): string {
  if (value.length <= MAX_LENGTH) return value;
  const cut = value.slice(0, MAX_LENGTH);
  const lastHyphen = cut.lastIndexOf("-");
  return (lastHyphen > 1 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
}

/**
 * Slug di partenza per un nome. `fallback` è il codice invito dell'utente:
 * viene usato quando il nome non produce nulla di utilizzabile (nome assente,
 * scrittura non latina, solo emoji, o parola riservata).
 *
 * Non garantisce l'unicità: quella la decide allocateProfileSlug + il vincolo DB.
 */
export function baseProfileSlug(name: string | null | undefined, fallback: string): string {
  const candidate = truncateAtHyphen(slugify(name ?? ""));

  const unusable =
    candidate.length < 2 || /^\d+$/.test(candidate) || RESERVED_SLUGS.has(candidate);

  return unusable ? fallback.toLowerCase() : candidate;
}
