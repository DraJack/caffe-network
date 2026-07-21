"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { REF_COOKIE } from "@/lib/referral";
import { allocateReferralCode, resolveSponsorId } from "@/server/referral";
import { buildProfileCreateData, isUniqueViolationOn } from "@/server/consultant-profile";

const registerSchema = z.object({
  name: z.string().min(2, "Inserisci il tuo nome"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  sponsorCode: z.string().optional(),
});

export type ActionState = { error?: string } | undefined;

export async function registerUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    sponsorCode: formData.get("sponsorCode") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  const { name, email, password, sponsorCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return { error: "Esiste già un account con questa email" };


  // ── Sponsor: costruisce l'albero unilevel ──
  // Precedenza al codice digitato, poi al cookie lasciato dal link di invito.
  // La gestione errori è volutamente asimmetrica: un codice DIGITATO sbagliato è
  // un errore dell'utente e va segnalato (prima falliva in silenzio), mentre un
  // cookie scaduto non deve mai impedire una registrazione.
  const cookieStore = await cookies();
  const codeFromCookie = cookieStore.get(REF_COOKIE)?.value;

  let sponsorId: string | undefined;
  if (sponsorCode) {
    const resolved = await resolveSponsorId(sponsorCode);
    if (!resolved) return { error: "Codice consulente non valido" };
    sponsorId = resolved;
  } else if (codeFromCookie) {
    sponsorId = (await resolveSponsorId(codeFromCookie)) ?? undefined;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const referralCode = await allocateReferralCode();

  // ── Account + conto provvigioni + vetrina, in un'unica create annidata ──
  // La vetrina /c/[slug] nasce con l'account: il link da condividere deve
  // esistere dal primo minuto, senza un passaggio di attivazione.
  //
  // Il retry esiste perché due "Marco Rossi" simultanei calcolano lo stesso
  // slug: il pre-check in allocateProfileSlug è un'ottimizzazione, l'arbitro è
  // il vincolo @unique. L'ultimo tentativo usa il referralCode come slug, che è
  // unique per costruzione — così il ciclo termina sempre.
  for (let attempt = 0; attempt < 3; attempt++) {
    const isLastAttempt = attempt === 2;
    const profile = isLastAttempt
      ? { slug: referralCode.toLowerCase(), displayName: name }
      : await buildProfileCreateData(name, referralCode);

    try {
      await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          sponsorId,
          referralCode,
          commissionAccount: { create: {} },
          consultantProfile: { create: profile },
        },
      });
      break;
    } catch (error) {
      // Chiude anche la finestra fra il findUnique qui sopra e questa create:
      // due registrazioni con la stessa email arrivano fin qui e una perde.
      if (isUniqueViolationOn(error, "email")) {
        return { error: "Esiste già un account con questa email" };
      }
      if (isUniqueViolationOn(error, "slug") && !isLastAttempt) continue;
      throw error;
    }
  }

  // L'attribuzione è stata consumata.
  cookieStore.delete(REF_COOKIE);

  // Login automatico dopo la registrazione
  await signIn("credentials", { email: email.toLowerCase(), password, redirectTo: "/account" });
  return undefined;
}

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
});

export async function loginUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o password non corretti" };
    }
    throw error; // redirect() interno di NextAuth
  }
  return undefined;
}
