import "server-only";
import { prisma } from "@/lib/prisma";
import { generateReferralCode, normalizeReferralCode } from "@/lib/referral";
import { initials, type SponsorPreview } from "@/lib/mini-site";

const sponsorSelect = {
  id: true,
  name: true,
  referralCode: true,
  consultantProfile: { select: { displayName: true } },
} as const;

/**
 * Lookup condivisa: accetta sia il codice invito sia lo slug del mini-sito.
 * Unico punto in cui vive la regola di risoluzione, così resolveSponsorId e
 * getSponsorPreview non possono divergere.
 */
async function findSponsorByCodeOrSlug(rawCode: string) {
  const raw = rawCode.trim();
  if (!raw) return null;

  // I codici invito si confrontano normalizzati (maiuscoli, senza separatori):
  // così "caffe 001" e "CAFFE-001" trovano comunque CAFFE001.
  const code = normalizeReferralCode(raw);
  if (code) {
    const byCode = await prisma.user.findUnique({
      where: { referralCode: code },
      select: sponsorSelect,
    });
    if (byCode) return byCode;
  }

  // Gli slug dei mini-siti NON vanno normalizzati allo stesso modo: i trattini
  // fanno parte dello slug ("anna-bianchi") e rimuoverli lo renderebbe introvabile.
  const bySlug = await prisma.consultantProfile.findFirst({
    where: { slug: raw.toLowerCase(), active: true },
    select: { user: { select: sponsorSelect } },
  });
  return bySlug?.user ?? null;
}

/**
 * Risolve un codice invito in un userId.
 * Ritorna null se il codice non corrisponde a nulla.
 */
export async function resolveSponsorId(rawCode: string): Promise<string | null> {
  const sponsor = await findSponsorByCodeOrSlug(rawCode);
  return sponsor?.id ?? null;
}

/**
 * Chi sta invitando, per mostrarlo su /registrati.
 *
 * Restituisce sempre il `referralCode` canonico, mai lo slug: è quello che va
 * precompilato nel form. Prima ci finiva il valore grezzo del cookie, quindi
 * chi arrivava da /c/anna-bianchi si vedeva scritto "anna-bianchi" nel campo
 * "Codice invito" — che sembra un codice sbagliato.
 *
 * Un null qui significa solo "nessun saluto da mostrare": non deve mai
 * impedire una registrazione (cookie scaduto, profilo disattivato, spazzatura).
 */
export async function getSponsorPreview(rawCode: string): Promise<SponsorPreview | null> {
  const sponsor = await findSponsorByCodeOrSlug(rawCode);
  if (!sponsor) return null;

  const displayName = sponsor.consultantProfile?.displayName || sponsor.name;
  if (!displayName) return null;

  return {
    displayName,
    initials: initials(displayName),
    referralCode: sponsor.referralCode,
  };
}

/**
 * Genera un codice invito libero.
 * Con 31^8 combinazioni le collisioni sono improbabili, ma il vincolo unique
 * in DB è reale: si riprova qualche volta prima di lasciar decidere al default.
 */
export async function allocateReferralCode(attempts = 5): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const code = generateReferralCode();
    const taken = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!taken) return code;
  }
  // Fallback: allunga il codice per rendere la collisione trascurabile.
  return generateReferralCode(12);
}
