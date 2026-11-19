import Link from "next/link";
import {
  Coffee,
  Coins,
  Users,
  Truck,
  ShieldCheck,
  Flame,
  UserPlus,
  Share2,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { BeanDivider, BrandLogo } from "@/components/brand-logo";
import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts } from "@/server/catalog";
import { getStoreConfig } from "@/lib/config";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Le cifre (provvigione L1, soglia spedizione) vengono da StoreConfig:
  // sono modificabili da admin e non vanno mai scritte a mano.
  const [featured, config] = await Promise.all([getFeaturedProducts(), getStoreConfig()]);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-coffee-950 text-cream">
        {/* Alone caldo dietro al titolo + grana: profondità senza immagini pesanti */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(45%_70%_at_78%_45%,rgba(216,185,136,0.16),transparent_70%)]"
        />
        <div className="grain absolute inset-0 -z-10" aria-hidden />

        <div className="container-page grid gap-10 py-14 md:grid-cols-2 md:items-center md:gap-12 md:py-24">
          {/* Il logo è il protagonista: su mobile viene prima del titolo */}
          <div className="order-first flex animate-scale-in justify-center md:order-last">
            <BrandLogo preload className="max-w-64 md:max-w-[26rem]" />
          </div>

          <div>
            <p className="mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-accent/30 bg-coffee-900/60 px-4 py-1.5 text-sm text-accent backdrop-blur">
              <Flame className="h-4 w-4" /> Tostato fresco, ogni settimana
            </p>
            <h1
              className="animate-fade-up text-balance font-heading text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Il caffè che unisce <span className="text-gold">gusto</span> e{" "}
              <span className="text-gold">community</span>
            </h1>
            <p
              className="mt-6 max-w-md animate-fade-up text-lg leading-relaxed text-coffee-300"
              style={{ animationDelay: "160ms" }}
            >
              Miscele e single origin selezionati. Acquista online e, se vuoi, invita chi vuoi:
              guadagni una provvigione su ogni loro ordine.
            </p>
            <div
              className="mt-9 flex animate-fade-up flex-wrap gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Button asChild variant="accent" size="lg">
                <Link href="/catalogo">
                  Scopri il catalogo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-accent/50 text-accent hover:border-accent hover:bg-accent/10"
              >
                <Link href="/consulenti">Come si guadagna</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Fascia trust attaccata al fondo dell'hero */}
        <div className="relative border-t border-accent/20">
          <div className="container-page grid gap-4 py-5 text-sm text-coffee-300 sm:grid-cols-3">
            <TrustItem
              icon={<Truck className="h-4 w-4" />}
              label={`Spedizione gratuita sopra ${formatEuro(config.freeShippingThreshold)}`}
            />
            <TrustItem icon={<ShieldCheck className="h-4 w-4" />} label="Pagamento sicuro Stripe" />
            <TrustItem icon={<Flame className="h-4 w-4" />} label="Tostatura settimanale" />
          </div>
        </div>
      </section>

      {/* ── Vantaggi ───────────────────────────────────────── */}
      <section className="bg-coffee-950">
        <div className="container-page grid gap-5 py-16 sm:grid-cols-3">
          {[
            {
              icon: <Coins className="h-5 w-5" />,
              title: "Guadagna invitando",
              body: `${formatEuro(config.commissionL1Cents)} su ogni confezione comprata da chi inviti, più una quota fino al quinto livello.`,
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "La tua rete",
              body: "Segui la crescita della tua rete e i tuoi guadagni dalla dashboard.",
            },
            {
              icon: <Truck className="h-5 w-5" />,
              title: "Spedizione rapida",
              body: `Consegna in tutta Italia, gratuita sopra ${formatEuro(config.freeShippingThreshold)} di spesa.`,
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="group h-full rounded-2xl border border-accent/20 bg-coffee-900 p-7 transition-all duration-300 ease-out-quart hover:-translate-y-1 hover:border-accent/50">
                <div className="mb-4 inline-flex rounded-2xl bg-accent/12 p-3.5 text-accent transition-transform duration-300 group-hover:scale-110">
                  {f.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold text-cream">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-coffee-300">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Come funziona ──────────────────────────────────── */}
      <section className="border-y border-accent/20 bg-coffee-900">
        <div className="container-page py-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
                Come funziona
              </p>
              <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-cream md:text-4xl">
                Tre passi, nessun costo d&apos;ingresso
              </h2>
              <BeanDivider className="mt-5" />
              <p className="mt-5 leading-relaxed text-coffee-300">
                Non serve diventare consulente né pagare una quota: basta un account gratuito e il
                tuo link personale.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <UserPlus className="h-5 w-5" />,
                title: "Crea l'account",
                body: "Registrazione gratuita in un minuto. Ricevi subito il tuo codice invito.",
              },
              {
                icon: <Share2 className="h-5 w-5" />,
                title: "Condividi il link",
                body: "Chi acquista dal tuo link entra nella tua rete, fino a cinque livelli di profondità.",
              },
              {
                icon: <Wallet className="h-5 w-5" />,
                title: "Incassa",
                body: "Le provvigioni maturano dopo la consegna. Quando vuoi, richiedi il bonifico.",
              },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 110}>
                <div className="relative h-full rounded-2xl border border-accent/20 bg-coffee-950 p-7">
                  <span className="absolute right-6 top-5 font-heading text-5xl font-bold text-coffee-800">
                    {i + 1}
                  </span>
                  <div className="mb-4 inline-flex rounded-2xl bg-accent/12 p-3.5 text-accent">
                    {s.icon}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-cream">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-coffee-300">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="mt-10 text-center">
              <Button asChild variant="accent">
                <Link href="/consulenti">
                  Vedi il piano completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── In evidenza ────────────────────────────────────── */}
      <section className="container-page py-10">
        <Reveal>
          <div className="mb-7 flex items-end justify-between gap-4">
            <h2 className="font-heading text-3xl font-bold text-coffee-900">In evidenza</h2>
            <Link
              href="/catalogo"
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-dark transition-colors hover:text-coffee-900"
            >
              Vedi tutto
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        {featured.length === 0 ? (
          <EmptyState
            icon={<Coffee className="h-7 w-7" />}
            title="Nessun prodotto in evidenza"
            description="Stiamo preparando la selezione. Nel frattempo puoi sfogliare tutto il catalogo."
            action={{ label: "Vai al catalogo", href: "/catalogo" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.slug} delay={i * 70} className="h-full">
                <ProductCard {...p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-accent">{icon}</span>
      {label}
    </div>
  );
}
