import { prisma } from "@/lib/prisma";

/** Valori di default della configurazione store (usati anche come fallback). */
export const DEFAULT_STORE_CONFIG = {
  id: "default",
  flatShippingCents: 500,
  freeShippingThreshold: 4900,
  // Piano provvigionale: 10€ / 2€ / 2€ / 2€ / 3€ per confezione ⇒ 19€ su 50€ (38%).
  commissionL1Cents: 1000,
  commissionL2Cents: 200,
  commissionL3Cents: 200,
  commissionL4Cents: 200,
  commissionL5Cents: 300,
  maxCommissionPercent: 40,
  commissionMaturationDays: 14,
  commissionFallbackDays: 45,
  minPayoutCents: 2000,
};

/** Recupera la configurazione store, creandola con i default se assente. */
export async function getStoreConfig() {
  const existing = await prisma.storeConfig.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.storeConfig.create({ data: { id: "default" } });
}
