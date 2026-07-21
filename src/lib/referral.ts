// Codici invito leggibili e dettabili a voce.

/** Nome del cookie di attribuzione (scritto da src/proxy.ts). */
export const REF_COOKIE = "cn_ref";

/** 30 giorni: finestra di attribuzione dopo il clic sul link. */
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Alfabeto senza caratteri ambigui: niente 0/O, 1/I/L.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Genera un codice invito di 8 caratteri (es. "K7PQ4MRT"). */
export function generateReferralCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Normalizza un codice digitato dall'utente (spazi, minuscole, trattini). */
export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

/** URL completo da condividere. */
export function referralUrl(code: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/?ref=${code}`;
}
