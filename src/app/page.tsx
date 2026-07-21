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
import { ProductImage } from "@/components/ui/product-image";
import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts, getCategories } from "@/server/catalog";
import { getStoreConfig } from "@/lib/config";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Le cifre (provvigione L1, soglia spedizione) vengono da StoreConfig:
  // sono modificabili da admin e non vanno mai scritte a mano.
  const [featured, categories, config] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getStoreConfig(),
  ]);

  const showcase = featured[0];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-coffee-950 text-cream">
        {/* Alone caldo dietro al titolo + grana: profondità senza immagini pesanti */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_15%_0%,rgba(201,146,43,0.22),transparent_60%),radial-gradient(50%_50%_at_100%_100%,rgba(143,88,54,0.35),transparent_65%)]"
        />
        <div className="grain absolute inset-0 -z-10" aria-hidden />

        <div className="container-page grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <p className="mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-coffee-700/60 bg-coffee-900/60 px-4 py-1.5 text-sm text-accent backdrop-blur">
              <Flame className="h-4 w-4" /> Tostato fresco, ogni settimana
            </p>
            <h1
              className="animate-fade-up text-balance font-heading text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Il caffè che unisce <span className="text-accent">gusto</span> e{" "}
              <span className="text-accent">community</span>
            </h1>
            <p
              className="mt-6 max-w-md animate-fade-up text-lg leading-relaxed text-coffee-200"
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
                className="border-coffee-600 text-cream hover:border-coffee-500 hover:bg-coffee-800"
              >
                <Link href="/consulenti">Come si guadagna</Link>
              </Button>
            </div>
          </div>

          {/* Vetrina: un prodotto vero, non un segnaposto */}
          <div className="hidden md:block">
            {showcase ? (
              <Link
                href={`/prodotto/${showcase.slug}`}
                className="group relative block animate-scale-in"
                style={{ animationDelay: "200ms" }}
              >
                <div className="overflow-hidden rounded-3xl bg-coffee-900 p-3 shadow-(--shadow-hero) ring-1 ring-coffee-700/50">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-coffee-800">
                    <ProductImage
                      src={showcase.image}
                      alt={showcase.name}
                      className="transition-transform duration-700 ease-out-quart group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-4 px-3 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-accent">In evidenza</p>
                      <p className="mt-1 font-heading text-xl font-semibold text-cream">
                        {showcase.name}
                      </p>
                      {showcase.origin && (
                        <p className="text-sm text-coffee-300">{showcase.origin}</p>
                      )}
                    </div>
                    <p className="shrink-0 font-heading text-2xl font-semibold text-cream">
                      {formatEuro(showcase.fromCents)}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-square animate-scale-in items-center justify-center rounded-3xl bg-gradient-to-br from-coffee-800 to-coffee-900 shadow-(--shadow-hero) ring-1 ring-coffee-700/50">
                <Coffee className="h-40 w-40 text-accent/40" strokeWidth={0.75} />
              </div>
            )}
          </div>
        </div>

        {/* Fascia trust attaccata al fondo dell'hero */}
        <div className="relative border-t border-coffee-800/70">
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
      <section className="container-page grid gap-5 py-16 sm:grid-cols-3">
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
            <div className="group h-full rounded-2xl border border-coffee-100 bg-white p-7 shadow-(--shadow-card) transition-all duration-300 ease-out-quart hover:-translate-y-1 hover:shadow-(--shadow-lift)">
              <div className="mb-4 inline-flex rounded-2xl bg-accent/12 p-3.5 text-accent-dark transition-transform duration-300 group-hover:scale-110">
                {f.icon}
              </div>
              <h3 className="font-heading text-lg font-semibold text-coffee-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-coffee-600">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ── Come funziona ──────────────────────────────────── */}
      <section className="border-y border-coffee-100 bg-white/60">
        <div className="container-page py-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
                Come funziona
              </p>
              <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-coffee-900 md:text-4xl">
                Tre passi, nessun costo d&apos;ingresso
              </h2>
              <p className="mt-4 leading-relaxed text-coffee-600">
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
                <div className="relative h-full rounded-2xl border border-coffee-100 bg-white p-7 shadow-(--shadow-soft)">
                  <span className="absolute right-6 top-5 font-heading text-5xl font-bold text-coffee-100">
                    {i + 1}
                  </span>
                  <div className="mb-4 inline-flex rounded-2xl bg-coffee-800 p-3.5 text-accent">
                    {s.icon}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-coffee-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-coffee-600">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="mt-10 text-center">
              <Button asChild variant="primary">
                <Link href="/consulenti">
                  Vedi il piano completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Categorie ──────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="container-page pt-14">
          <Reveal>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/catalogo?categoria=${c.slug}`}
                  className="rounded-full border border-coffee-200 bg-white px-4 py-2 text-sm font-medium text-coffee-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-coffee-300 hover:bg-coffee-50 hover:text-coffee-900 hover:shadow-(--shadow-soft)"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ── In evidenza ────────────────────────────────────── */}
      <section className="container-page py-10">
        <Reveal>
          <div className="mb-7 flex items-end justify-between gap-4">
            <h2 className="font-heading text-3xl font-bold text-coffee-900">In evidenza</h2>
            <Link
              href="/catalogo"
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-dark transition-colors hover:text-accent"
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
              <Reveal key={p.slug} delay={i * 70}>
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
