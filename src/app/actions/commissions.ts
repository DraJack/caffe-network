"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/guards";
import { createPayoutRequest } from "@/server/payouts";

export type PayoutState = { error?: string; success?: string } | undefined;

/** Controllo IBAN ISO 13616 (mod 97): intercetta anche le cifre scambiate. */
function ibanChecksumOk(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const digits = code >= 65 ? String(code - 55) : ch;
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

const schema = z.object({
  holderName: z.string().trim().min(3, "Inserisci l'intestatario del conto").max(100),
  iban: z
    .string()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, "IBAN non valido")
        .refine(ibanChecksumOk, "IBAN non valido: controlla le cifre"),
    ),
});

/** Richiesta di prelievo delle provvigioni disponibili (logica in src/server/payouts.ts). */
export async function requestPayout(_prev: PayoutState, formData: FormData): Promise<PayoutState> {
  const sessionUser = await requireUser();

  const parsed = schema.safeParse({
    holderName: formData.get("holderName"),
    iban: formData.get("iban"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const result = await createPayoutRequest(sessionUser.id, parsed.data);

  revalidatePath("/account/provvigioni");
  return result;
}
