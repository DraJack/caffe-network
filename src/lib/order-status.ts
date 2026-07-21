import type { BadgeProps } from "@/components/ui/card";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

/**
 * Etichette e colori degli stati ordine, in un posto solo.
 * Prima le label erano duplicate tra /account e /account/ordini e ogni
 * stato usava lo stesso badge grigio, quindi non erano distinguibili a colpo d'occhio.
 */
export const ORDER_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "In attesa", variant: "warning" },
  PAID: { label: "Pagato", variant: "accent" },
  SHIPPED: { label: "Spedito", variant: "neutral" },
  DELIVERED: { label: "Consegnato", variant: "success" },
  CANCELLED: { label: "Annullato", variant: "danger" },
};

export function orderStatus(status: string) {
  return ORDER_STATUS[status] ?? { label: status, variant: "neutral" as BadgeVariant };
}

/** Stati provvigione: stesso principio del ciclo ordine. */
export const COMMISSION_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "In maturazione", variant: "warning" },
  APPROVED: { label: "Disponibile", variant: "success" },
  PAID: { label: "Incassata", variant: "accent" },
  REVERSED: { label: "Stornata", variant: "danger" },
};

export function commissionStatus(status: string) {
  return COMMISSION_STATUS[status] ?? { label: status, variant: "neutral" as BadgeVariant };
}
