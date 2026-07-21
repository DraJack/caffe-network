import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { baseProfileSlug } from "@/lib/slug";

/** Nome mostrato quando l'utente non ha un `name` (legacy: il campo è nullable). */
export const DEFAULT_DISPLAY_NAME = "Consulente";

const MAX_SLUG_SUFFIX = 50;

/** true se l'errore Prisma è una violazione di unique sul campo indicato. */
export function isUniqueViolationOn(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  return typeof target === "string" && target.includes(field);
}

/**
 * Trova uno slug libero a partire da `base`, provando base, base-2, base-3…
 * Una sola query invece di N: si leggono tutti gli slug con quel prefisso e si
 * cerca il primo buco in memoria.
 *
 * ⚠️ È un'ottimizzazione, non una garanzia: due registrazioni simultanee con lo
 * stesso nome possono ottenere entrambe lo stesso slug. La garanzia è il vincolo
 * @unique in DB, gestito dal retry in chi chiama.
 */
export async function allocateProfileSlug(base: string): Promise<string> {
  const taken = new Set(
    (
      await prisma.consultantProfile.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((p) => p.slug),
  );

  if (!taken.has(base)) return base;
  for (let i = 2; i <= MAX_SLUG_SUFFIX; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Oltre 50 omonimi: si smette di cercare e decide chi chiama (userà il codice invito).
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Dati di creazione del profilo per un nuovo utente.
 * `referralCode` è il paracadute: è già unique in DB, quindi come slug è
 * garantito libero anche quando il nome non produce nulla di usabile.
 */
export async function buildProfileCreateData(
  name: string | null | undefined,
  referralCode: string,
): Promise<{ slug: string; displayName: string }> {
  const base = baseProfileSlug(name, referralCode);
  return {
    slug: await allocateProfileSlug(base),
    displayName: name?.trim() || DEFAULT_DISPLAY_NAME,
  };
}

/**
 * Restituisce il profilo dell'utente, creandolo se manca.
 *
 * Serve agli utenti registrati prima di questa funzionalità: invece di uno
 * script di backfill una tantum, la vetrina nasce alla prima apertura della
 * pagina che ne ha bisogno. A regime è una findUnique su indice unique.
 */
export async function ensureConsultantProfile(userId: string) {
  const existing = await prisma.consultantProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, referralCode: true },
  });

  // Due tab aperte contemporaneamente arrivano entrambe qui: si tenta, e se
  // qualcun altro ha vinto la corsa si rilegge la riga vincente.
  for (let attempt = 0; attempt < 3; attempt++) {
    const isLastAttempt = attempt === 2;
    const data = isLastAttempt
      ? { slug: user.referralCode.toLowerCase(), displayName: user.name?.trim() || DEFAULT_DISPLAY_NAME }
      : await buildProfileCreateData(user.name, user.referralCode);

    try {
      return await prisma.consultantProfile.create({ data: { ...data, userId } });
    } catch (error) {
      if (isUniqueViolationOn(error, "userId")) {
        return prisma.consultantProfile.findUniqueOrThrow({ where: { userId } });
      }
      if (isUniqueViolationOn(error, "slug") && !isLastAttempt) continue;
      throw error;
    }
  }
  // Irraggiungibile: l'ultimo tentativo usa il referralCode, unique per costruzione.
  return prisma.consultantProfile.findUniqueOrThrow({ where: { userId } });
}

/**
 * Profilo pubblico per /c/[slug]. In cache() perché generateMetadata e il corpo
 * della pagina girano nello stesso render pass: una query, non due.
 */
export const getMiniSiteBySlug = cache(async (slug: string) => {
  return prisma.consultantProfile.findFirst({
    where: { slug: slug.toLowerCase(), active: true },
    select: {
      slug: true,
      displayName: true,
      theme: true,
      tagline: true,
      user: { select: { referralCode: true } },
    },
  });
});
