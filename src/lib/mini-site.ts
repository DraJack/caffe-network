// Token e copy del mini-sito consulente.
// Modulo puro: lo usano la pagina pubblica, l'editor client e l'immagine OG.

import type { MiniSiteTheme, MiniSiteTagline } from "@prisma/client";

export type MiniSiteThemeTokens = {
  label: string;
  /** Descrizione mostrata nell'editor. */
  hint: string;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  onAccent: string;
  hairline: string;
  /** Colore del bagliore radiale dietro l'hero. */
  glow: string;
  /** Opacità della grana (--grain-opacity): su fondo chiaro va tenuta bassa. */
  grain: number;
};

/**
 * I valori sono HEX GREZZI, non `var(--color-coffee-950)`.
 * Vincolo reale: ImageResponse (next/og) renderizza fuori dal documento e non
 * può risolvere le variabili di globals.css. Una sola mappa serve entrambi i
 * consumatori, quindi deve parlare la lingua del più limitato dei due.
 */
export const MINI_SITE_THEMES = {
  NOTTE: {
    label: "Notte",
    hint: "Caffè scuro e oro. L'atmosfera del brand.",
    bg: "#1a0f0a",
    fg: "#faf6f1",
    muted: "#d0ad89",
    accent: "#c9922b",
    onAccent: "#2c1a12",
    hairline: "#72442e",
    glow: "rgb(201 146 43 / 0.22)",
    grain: 0.16,
  },
  CREMA: {
    label: "Crema",
    hint: "Fondo chiaro e luminoso, massima leggibilità.",
    bg: "#faf6f1",
    fg: "#2c1a12",
    muted: "#8f5836",
    accent: "#a5761d",
    onAccent: "#faf6f1",
    hairline: "#e2cdb5",
    glow: "rgb(165 118 29 / 0.10)",
    grain: 0.05,
  },
  TOSTATURA: {
    label: "Tostatura",
    hint: "Marrone caldo e rame. Più morbido del Notte.",
    bg: "#4b2e1e",
    fg: "#faf6f1",
    muted: "#e2cdb5",
    accent: "#c97a3a",
    onAccent: "#2c1a12",
    hairline: "#8f5836",
    glow: "rgb(201 122 58 / 0.20)",
    grain: 0.14,
  },
} as const satisfies Record<MiniSiteTheme, MiniSiteThemeTokens>;

export const MINI_SITE_THEME_KEYS = Object.keys(MINI_SITE_THEMES) as MiniSiteTheme[];

export function themeTokens(theme: MiniSiteTheme): MiniSiteThemeTokens {
  return MINI_SITE_THEMES[theme] ?? MINI_SITE_THEMES.NOTTE;
}

/**
 * Frasi selezionabili. Sono scritte da noi apposta: parlano del caffè e mai di
 * guadagni, così nessun consulente può pubblicare una promessa di rendita.
 */
export const MINI_SITE_TAGLINES = {
  NESSUNA: { label: "Nessuna frase", text: null },
  QUOTIDIANO: {
    label: "Il caffè di tutti i giorni",
    text: "Il caffè che bevo tutti i giorni, adesso anche a casa tua.",
  },
  RISVEGLIO: {
    label: "Il risveglio giusto",
    text: "Una tazzina fatta bene cambia l'inizio della giornata.",
  },
  CONDIVISO: {
    label: "Meglio in compagnia",
    text: "Il caffè è buono da solo, ma è un'altra cosa in compagnia.",
  },
  SCELTA: {
    label: "Una scelta di gusto",
    text: "Miscele scelte una per una, senza fretta.",
  },
} as const satisfies Record<MiniSiteTagline, { label: string; text: string | null }>;

export const MINI_SITE_TAGLINE_KEYS = Object.keys(MINI_SITE_TAGLINES) as MiniSiteTagline[];

export function taglineText(tagline: MiniSiteTagline): string | null {
  return MINI_SITE_TAGLINES[tagline]?.text ?? null;
}

/**
 * Chi sta invitando, mostrato in cima al form di registrazione.
 * Vive qui e non in src/server/referral.ts perché lo consuma anche un
 * componente client, che non deve importare un modulo "server-only".
 */
export type SponsorPreview = {
  displayName: string;
  initials: string;
  referralCode: string;
};

/** Iniziali per il cerchio segnaposto (non esiste upload immagini nel progetto). */
export function initials(name: string): string {
  const value = name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return value || "C";
}

/** URL pubblico del mini-sito, da condividere. */
export function miniSiteUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/c/${slug}`;
}

/** Versione senza protocollo, per mostrarla in UI senza il rumore di "https://". */
export function miniSiteDisplayUrl(slug: string, baseUrl?: string): string {
  return miniSiteUrl(slug, baseUrl).replace(/^https?:\/\//, "");
}
