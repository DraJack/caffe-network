import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { matureDueCommissions } from "@/server/commissions";

export const dynamic = "force-dynamic";

/**
 * Maturazione giornaliera: porta ad APPROVED le provvigioni la cui finestra
 * resi è scaduta. Schedulata in vercel.json.
 *
 * Non è però la garanzia di correttezza del denaro: requestPayout richiama la
 * stessa funzione per l'utente prima di calcolare il disponibile, così un cron
 * saltato non può bloccare né sottopagare un prelievo.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configurato" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const result = await prisma.$transaction(
    async (tx) => matureDueCommissions(tx),
    { timeout: 30_000, maxWait: 5_000 },
  );

  return NextResponse.json({ ok: true, ...result });
}
