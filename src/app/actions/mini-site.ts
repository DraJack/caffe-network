"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MiniSiteTheme, MiniSiteTagline } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
import { ensureConsultantProfile } from "@/server/consultant-profile";

export type MiniSiteState = { error?: string; success?: string } | undefined;

/**
 * Nota su cosa NON c'è qui:
 * - `slug` è assente di proposito. È immutabile, e l'immutabilità va imposta al
 *   confine dei dati: ometterlo solo dalla UI lascerebbe passare un campo forgiato.
 * - Nessun campo di testo libero. Una bio libera su pagina pubblica aprirebbe a
 *   promesse di guadagno impossibili da moderare (L. 173/2005): le frasi sono
 *   scritte da noi e l'utente ne sceglie una.
 */
const schema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(60, "Il nome è troppo lungo"),
  theme: z.enum(MiniSiteTheme),
  tagline: z.enum(MiniSiteTagline),
});

export async function updateMiniSite(
  _prev: MiniSiteState,
  formData: FormData,
): Promise<MiniSiteState> {
  // Mai gate sul ruolo: le sessioni sono JWT e il ruolo può essere stantio
  // (CLAUDE.md §6). Basta essere autenticati, e si scrive solo sul proprio id.
  const sessionUser = await requireUser();

  const parsed = schema.safeParse({
    displayName: formData.get("displayName"),
    theme: formData.get("theme"),
    tagline: formData.get("tagline"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  // Utenti registrati prima di questa funzionalità: la vetrina nasce ora.
  const profile = await ensureConsultantProfile(sessionUser.id);

  await prisma.consultantProfile.update({
    // Chiave l'utente in sessione, mai un id che arriva dal form.
    where: { userId: sessionUser.id },
    data: parsed.data,
  });

  revalidatePath(`/c/${profile.slug}`);
  revalidatePath("/account/vetrina");
  return { success: "Vetrina aggiornata" };
}
