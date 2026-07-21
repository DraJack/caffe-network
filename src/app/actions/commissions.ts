"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
import { getStoreConfig } from "@/lib/config";
import { formatEuro } from "@/lib/utils";
import { matureDueCommissions, recomputeCommissionBalances } from "@/server/commissions";

export type PayoutState = { error?: string; success?: string } | undefined;

const schema = z.object({
  holderName: z.string().min(3, "Inserisci l'intestatario del conto"),
  // Validazione IBAN di forma, non di checksum: basta a intercettare i refusi.
  iban: z
    .string()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, "IBAN non valido")),
});

/**
 * Richiesta di prelievo delle provvigioni disponibili.
 *
 * Matura le provvigioni scadute PRIMA di calcolare il disponibile: così il
 * prelievo è corretto anche se il cron giornaliero non è passato.
 */
export async function requestPayout(_prev: PayoutState, formData: FormData): Promise<PayoutState> {
  const sessionUser = await requireUser();
  const config = await getStoreConfig();

  const parsed = schema.safeParse({
    holderName: formData.get("holderName"),
    iban: formData.get("iban"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.commissionAccount.upsert({
      where: { userId: sessionUser.id },
      update: {},
      create: { userId: sessionUser.id },
    });

    // Una sola richiesta aperta per volta: evita doppi prelievi dello stesso saldo.
    const open = await tx.payoutRequest.findFirst({
      where: { accountId: account.id, status: "REQUESTED" },
    });
    if (open) return { error: "Hai già una richiesta di prelievo in lavorazione." };

    await matureDueCommissions(tx, sessionUser.id);

    // Fonte di verità: il ledger, non il saldo denormalizzato.
    const eligible = await tx.commission.findMany({
      where: { accountId: account.id, status: "APPROVED", payoutRequestId: null },
      select: { id: true, amountCents: true },
    });
    const amountCents = eligible.reduce((s, c) => s + c.amountCents, 0);

    if (amountCents < config.minPayoutCents) {
      return {
        error: `Il minimo prelevabile è ${formatEuro(config.minPayoutCents)}. Disponibile: ${formatEuro(amountCents)}.`,
      };
    }

    const payout = await tx.payoutRequest.create({
      data: {
        accountId: account.id,
        amountCents,
        holderName: parsed.data.holderName,
        iban: parsed.data.iban,
      },
    });
    await tx.commission.updateMany({
      where: { id: { in: eligible.map((c) => c.id) } },
      data: { payoutRequestId: payout.id },
    });
    await recomputeCommissionBalances(tx, [account.id]);

    return { success: `Richiesta inviata: ${formatEuro(amountCents)}.` };
  }, { timeout: 15_000, maxWait: 5_000 });

  revalidatePath("/account/provvigioni");
  return result;
}
