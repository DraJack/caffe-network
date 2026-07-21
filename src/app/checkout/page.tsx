import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCart } from "@/server/cart";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const cart = await getCart();
  if (cart.items.length === 0) redirect("/carrello");

  const session = await auth();

  let user = null as { name: string | null; email: string } | null;
  if (session?.user?.id) {
    const u = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (u) user = { name: u.name, email: u.email };
  }

  return (
    <CheckoutForm
      subtotalCents={cart.subtotalCents}
      shippingCents={cart.shippingCents}
      isLoggedIn={!!session}
      prefillName={user?.name ?? ""}
      prefillEmail={user?.email ?? ""}
      // Righe d'ordine: tra carrello e pagamento l'utente non rivedeva
      // più cosa stava comprando, solo i totali.
      items={cart.items.map((it) => ({
        id: it.id,
        name: it.name,
        variantName: it.variantName,
        image: it.image,
        quantity: it.quantity,
        lineCents: it.lineCents,
      }))}
    />
  );
}
