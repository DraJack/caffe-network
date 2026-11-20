import Link from "next/link";
import { cookies } from "next/headers";
import { CheckCircle2, Package, Truck, Home, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe, STRIPE_ENABLED } from "@/lib/stripe";
import { LAST_ORDER_COOKIE } from "@/lib/order-status";
import { markOrderPaid } from "@/server/orders";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ordine confermato" };

type SearchParams = Promise<{ order?: string; demo?: string; session_id?: string }>;

/**
 * Il numero d'ordine è progressivo: da solo NON autorizza a vedere il riepilogo
 * (prima bastava cambiare ?order=1, 2, 3… per leggere gli acquisti altrui).
 * Lo vede il titolare loggato o il browser che ha appena fatto il checkout.
 */
async function loadOwnOrder(orderNumber: number) {
  if (!Number.isInteger(orderNumber) || orderNumber <= 0) return null;
  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: { items: true, payment: true },
  });
  if (!order) return null;

  const [session, store] = await Promise.all([auth(), cookies()]);
  const isOwner = !!order.userId && session?.user?.id === order.userId;
  const isThisBrowser = store.get(LAST_ORDER_COOKIE)?.value === order.id;
  return isOwner || isThisBrowser ? order : null;
}

/**
 * Rete di sicurezza se il webhook è in ritardo o non configurato: si chiede a
 * Stripe lo stato della sessione. markOrderPaid è idempotente, quindi webhook e
 * pagina di ritorno possono arrivare in qualsiasi ordine.
 */
async function confirmWithStripe(orderId: string, sessionId: string | undefined) {
  if (!STRIPE_ENABLED || !sessionId) return false;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (s.metadata?.orderId !== orderId || s.payment_status !== "paid") return false;
    await markOrderPaid(orderId, {
      sessionId: s.id,
      paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : undefined,
    });
    return true;
  } catch (error) {
    console.error("Verifica sessione Stripe fallita:", error);
    return false;
  }
}

export default async function SuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  let order = await loadOwnOrder(Number(sp.order));
  if (order?.status === "PENDING" && (await confirmWithStripe(order.id, sp.session_id))) {
    order = await loadOwnOrder(order.number);
  }
  const awaitingPayment = order?.status === "PENDING";

  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <div className="animate-scale-in rounded-full bg-emerald-50 p-5">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
      </div>

      <h1 className="mt-6 animate-fade-up font-heading text-4xl font-bold tracking-tight text-coffee-900">
        Grazie per il tuo ordine!
      </h1>

      {order ? (
        <>
          <p className="mt-3 animate-fade-up text-coffee-600" style={{ animationDelay: "80ms" }}>
            Ordine <strong className="text-coffee-900">#{order.number}</strong>{" "}
            {awaitingPayment
              ? "ricevuto: stiamo aspettando la conferma del pagamento, di solito arriva in pochi secondi."
              : "confermato. Puoi seguirne lo stato dalla sezione I miei ordini."}
          </p>

          {/* Cosa succede adesso: senza timeline l'utente resta senza aspettative */}
          <ol
            className="mt-10 flex w-full max-w-lg animate-fade-up items-start justify-between gap-2"
            style={{ animationDelay: "140ms" }}
          >
            <Step
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={awaitingPayment ? "In verifica" : "Confermato"}
              done={!awaitingPayment}
            />
            <Divider />
            <Step icon={<Package className="h-4 w-4" />} label="In preparazione" />
            <Divider />
            <Step icon={<Truck className="h-4 w-4" />} label="Spedito" />
            <Divider />
            <Step icon={<Home className="h-4 w-4" />} label="Consegnato" />
          </ol>

          <div
            className="mt-10 w-full max-w-md animate-fade-up rounded-2xl border border-coffee-100 bg-white p-6 text-left shadow-(--shadow-card)"
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="mb-4 font-heading text-lg font-semibold text-coffee-900">
              Riepilogo ordine
            </h2>
            <ul className="divide-y divide-coffee-100">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span className="text-coffee-700">
                    {it.name} <span className="text-coffee-400">× {it.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium text-coffee-900">
                    {formatEuro(it.priceCents * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-coffee-100 pt-4">
              <span className="font-semibold text-coffee-900">Totale</span>
              <span className="font-heading text-xl font-bold text-coffee-900">
                {formatEuro(order.totalCents)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-3 max-w-md text-coffee-600">
          Il tuo ordine è stato registrato. Accedi al tuo account per vederne il riepilogo.
        </p>
      )}

      {sp.demo === "1" && (
        <p className="mt-8 flex max-w-md items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Modalità demo: nessuna chiave Stripe configurata, il pagamento è stato simulato.
            Configura le chiavi Stripe di test per il flusso reale.
          </span>
        </p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild variant="accent">
          <Link href="/catalogo">Continua lo shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/account/ordini">I miei ordini</Link>
        </Button>
      </div>
    </div>
  );
}

function Step({
  icon,
  label,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  done?: boolean;
}) {
  return (
    <li className="flex flex-1 flex-col items-center gap-2">
      <span
        className={
          done
            ? "flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white"
            : "flex h-9 w-9 items-center justify-center rounded-full bg-coffee-100 text-coffee-400"
        }
      >
        {icon}
      </span>
      <span className={done ? "text-xs font-medium text-coffee-900" : "text-xs text-coffee-500"}>
        {label}
      </span>
    </li>
  );
}

function Divider() {
  return <span className="mt-4 h-px flex-1 bg-coffee-200" aria-hidden />;
}
